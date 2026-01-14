import crypto from "node:crypto";
import type { FastifyInstance } from "fastify";
import { getDb } from "../db";
import { authMiddleware } from "../middleware/auth";
import { sendWelcomeEmail } from "../services/email";
import { calculateGenerationCost } from "../services/replicate";
import { addCredits, assignSubscription, getCurrentYearMonth } from "../services/usage";

interface UserRow {
	id: string;
	username: string;
	email: string | null;
	is_admin: number;
	is_active: number;
	created_at: string;
	last_login: string | null;
}

interface ProductRow {
	id: string;
	name: string;
	description: string | null;
	monthly_image_limit: number | null;
	monthly_cost_limit: number | null;
	daily_image_limit: number | null;
	bonus_credits: number;
	price: number;
	is_active: number;
	created_at: string;
}

interface UsageRow {
	image_count: number;
	total_cost: number;
	used_own_key: number;
}

interface SubscriptionRow {
	id: string;
	product_id: string;
	product_name: string;
	starts_at: string;
	ends_at: string | null;
}

interface CreditRow {
	total: number;
}

interface StatsRow {
	total_users: number;
	total_generations: number;
	total_cost: number;
}

interface ModelCostRow {
	model: string;
	count: number;
	total_cost: number;
	avg_predict_time: number | null;
}

interface GenerationRow {
	id: string;
	model: string;
	width: number | null;
	height: number | null;
	parameters: string | null;
	cost: number;
}

// Admin-only middleware
async function adminMiddleware(
	request: { user?: { userId: string; isAdmin: boolean } },
	reply: { status: (code: number) => { send: (body: unknown) => void } },
): Promise<void> {
	if (!request.user?.isAdmin) {
		return reply.status(403).send({ error: "Admin access required" });
	}
}

export async function adminRoutes(fastify: FastifyInstance): Promise<void> {
	// Apply auth middleware to all admin routes
	fastify.addHook("preHandler", authMiddleware);
	fastify.addHook("preHandler", adminMiddleware);

	// GET /api/admin/stats - Dashboard statistics
	fastify.get("/api/admin/stats", async () => {
		const db = getDb();
		const yearMonth = getCurrentYearMonth();

		const stats = db
			.prepare(
				`SELECT
				(SELECT COUNT(*) FROM users) as total_users,
				(SELECT COUNT(*) FROM generations WHERE deleted_at IS NULL) as total_generations,
				(SELECT COALESCE(SUM(cost), 0) FROM generations) as total_cost`,
			)
			.get() as StatsRow;

		const monthlyStats = db
			.prepare(
				`SELECT
				COALESCE(SUM(image_count), 0) as image_count,
				COALESCE(SUM(total_cost), 0) as total_cost
			FROM usage_monthly WHERE year_month = ?`,
			)
			.get(yearMonth) as { image_count: number; total_cost: number };

		// Cost breakdown by model
		const costByModel = db
			.prepare(
				`SELECT
					model,
					COUNT(*) as count,
					COALESCE(SUM(cost), 0) as total_cost,
					AVG(predict_time) as avg_predict_time
				FROM generations
				WHERE deleted_at IS NULL
				GROUP BY model
				ORDER BY total_cost DESC`,
			)
			.all() as ModelCostRow[];

		const recentUsers = db
			.prepare(
				`SELECT id, username, created_at
			FROM users ORDER BY created_at DESC LIMIT 5`,
			)
			.all() as { id: string; username: string; created_at: string }[];

		return {
			totalUsers: stats.total_users,
			totalGenerations: stats.total_generations,
			totalCost: stats.total_cost,
			thisMonth: {
				imageCount: monthlyStats.image_count,
				totalCost: monthlyStats.total_cost,
			},
			costByModel: costByModel.map((row) => ({
				model: row.model,
				count: row.count,
				totalCost: row.total_cost,
				avgPredictTime: row.avg_predict_time,
				avgCostPerImage: row.count > 0 ? row.total_cost / row.count : 0,
			})),
			recentUsers,
		};
	});

	// GET /api/admin/users - List all users
	fastify.get<{ Querystring: { search?: string; page?: string; limit?: string } }>(
		"/api/admin/users",
		async (request, reply) => {
			const db = getDb();
			const search = (request.query.search || "").slice(0, 100); // Max 100 chars
			const page = Math.max(1, Number.parseInt(request.query.page || "1", 10) || 1);
			const limit = Math.min(100, Math.max(1, Number.parseInt(request.query.limit || "20", 10) || 20));
			const offset = (page - 1) * limit;
			const yearMonth = getCurrentYearMonth();

			let whereClause = "";
			const params: unknown[] = [];

			if (search) {
				whereClause = "WHERE username LIKE ? OR email LIKE ?";
				params.push(`%${search}%`, `%${search}%`);
			}

			const totalResult = db
				.prepare(`SELECT COUNT(*) as count FROM users ${whereClause}`)
				.get(...params) as { count: number };

			const users = db
				.prepare(`SELECT * FROM users ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
				.all(...params, limit, offset) as UserRow[];

			// Get usage and subscription for each user
			const usersWithDetails = users.map((user) => {
				const usage = db
					.prepare(
						"SELECT image_count, total_cost, used_own_key FROM usage_monthly WHERE user_id = ? AND year_month = ?",
					)
					.get(user.id, yearMonth) as UsageRow | undefined;

				const subscription = db
					.prepare(
						`SELECT us.id, us.product_id, sp.name as product_name, us.starts_at, us.ends_at
				FROM user_subscriptions us
				JOIN subscription_products sp ON sp.id = us.product_id
				WHERE us.user_id = ? AND (us.ends_at IS NULL OR us.ends_at > datetime('now'))
				ORDER BY us.created_at DESC LIMIT 1`,
					)
					.get(user.id) as SubscriptionRow | undefined;

				const credits = db
					.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM user_credits WHERE user_id = ?")
					.get(user.id) as CreditRow;

				return {
					id: user.id,
					username: user.username,
					email: user.email,
					isAdmin: user.is_admin === 1,
					isActive: user.is_active === 1,
					createdAt: user.created_at,
					lastLogin: user.last_login,
					currentMonth: usage
						? {
								imageCount: usage.image_count,
								totalCost: usage.total_cost,
								usedOwnKey: usage.used_own_key,
							}
						: { imageCount: 0, totalCost: 0, usedOwnKey: 0 },
					subscription: subscription
						? {
								productId: subscription.product_id,
								productName: subscription.product_name,
								startsAt: subscription.starts_at,
								endsAt: subscription.ends_at,
							}
						: null,
					credits: credits.total,
				};
			});

			return {
				users: usersWithDetails,
				total: totalResult.count,
				page,
				limit,
				totalPages: Math.ceil(totalResult.count / limit),
			};
		},
	);

	// POST /api/admin/users - Create new user
	fastify.post<{
		Body: {
			username: string;
			email: string;
			password?: string;
			sendEmail?: boolean;
		};
	}>("/api/admin/users", async (request, reply) => {
		const db = getDb();
		const { username, email, password, sendEmail } = request.body;

		if (!username || !email) {
			return reply.status(400).send({ error: "Username and email are required" });
		}

		// Check if username already exists
		const existingUser = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
		if (existingUser) {
			return reply.status(409).send({ error: "Username already exists" });
		}

		// Check if email already exists
		const existingEmail = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
		if (existingEmail) {
			return reply.status(409).send({ error: "Email already in use" });
		}

		// Generate password if not provided
		const finalPassword = password || crypto.randomBytes(8).toString("base64").slice(0, 12);

		// Hash password
		const hasher = new Bun.CryptoHasher("sha256");
		hasher.update(finalPassword);
		const passwordHash = hasher.digest("hex");

		const userId = crypto.randomUUID();

		db.prepare(
			`INSERT INTO users (id, username, password_hash, email, is_admin, is_active)
			VALUES (?, ?, ?, ?, 0, 1)`,
		).run(userId, username, passwordHash, email);

		// Assign default subscription if one exists
		const defaultProduct = db
			.prepare(
				"SELECT id FROM subscription_products WHERE is_active = 1 ORDER BY price ASC LIMIT 1",
			)
			.get() as { id: string } | undefined;

		if (defaultProduct) {
			assignSubscription(userId, defaultProduct.id);
		}

		// Send welcome email if requested
		let emailSent = false;
		let emailError: string | undefined;
		if (sendEmail) {
			const result = await sendWelcomeEmail(email, username, finalPassword);
			emailSent = result.success;
			emailError = result.error;
		}

		return {
			id: userId,
			username,
			email,
			isAdmin: false,
			isActive: true,
			emailSent,
			emailError,
			generatedPassword: !password ? finalPassword : undefined,
		};
	});

	// GET /api/admin/users/:id - Get single user details
	fastify.get<{ Params: { id: string } }>("/api/admin/users/:id", async (request, reply) => {
		const db = getDb();
		const { id } = request.params;

		const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;

		if (!user) {
			return reply.status(404).send({ error: "User not found" });
		}

		// Get all usage history
		const usageHistory = db
			.prepare("SELECT * FROM usage_monthly WHERE user_id = ? ORDER BY year_month DESC")
			.all(id) as (UsageRow & { year_month: string })[];

		// Get subscription history
		const subscriptionHistory = db
			.prepare(
				`SELECT us.*, sp.name as product_name
			FROM user_subscriptions us
			JOIN subscription_products sp ON sp.id = us.product_id
			WHERE us.user_id = ?
			ORDER BY us.created_at DESC`,
			)
			.all(id) as (SubscriptionRow & { created_at: string })[];

		// Get credit history
		const creditHistory = db
			.prepare("SELECT * FROM user_credits WHERE user_id = ? ORDER BY created_at DESC")
			.all(id) as {
			id: string;
			credit_type: string;
			amount: number;
			reason: string;
			created_at: string;
		}[];

		const credits = db
			.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM user_credits WHERE user_id = ?")
			.get(id) as CreditRow;

		// Check for API key
		const hasApiKey =
			db.prepare("SELECT 1 FROM user_api_keys WHERE user_id = ? AND is_active = 1").get(id) !==
			undefined;

		return {
			id: user.id,
			username: user.username,
			email: user.email,
			isAdmin: user.is_admin === 1,
			isActive: user.is_active === 1,
			createdAt: user.created_at,
			lastLogin: user.last_login,
			hasApiKey,
			credits: credits.total,
			usageHistory: usageHistory.map((u) => ({
				yearMonth: u.year_month,
				imageCount: u.image_count,
				totalCost: u.total_cost,
				usedOwnKey: u.used_own_key,
			})),
			subscriptionHistory: subscriptionHistory.map((s) => ({
				id: s.id,
				productId: s.product_id,
				productName: s.product_name,
				startsAt: s.starts_at,
				endsAt: s.ends_at,
				createdAt: s.created_at,
			})),
			creditHistory: creditHistory.map((c) => ({
				id: c.id,
				type: c.credit_type,
				amount: c.amount,
				reason: c.reason,
				createdAt: c.created_at,
			})),
		};
	});

	// PATCH /api/admin/users/:id - Update user
	fastify.patch<{
		Params: { id: string };
		Body: { isAdmin?: boolean; isActive?: boolean; email?: string };
	}>("/api/admin/users/:id", async (request, reply) => {
		const db = getDb();
		const { id } = request.params;
		const { isAdmin, isActive, email } = request.body;

		const user = db.prepare("SELECT id FROM users WHERE id = ?").get(id);
		if (!user) {
			return reply.status(404).send({ error: "User not found" });
		}

		const updates: string[] = [];
		const params: unknown[] = [];

		if (isAdmin !== undefined) {
			updates.push("is_admin = ?");
			params.push(isAdmin ? 1 : 0);
		}
		if (isActive !== undefined) {
			updates.push("is_active = ?");
			params.push(isActive ? 1 : 0);
		}
		if (email !== undefined) {
			updates.push("email = ?");
			params.push(email || null);
		}

		if (updates.length > 0) {
			params.push(id);
			db.prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`).run(...params);
		}

		return { success: true };
	});

	// POST /api/admin/users/:id/credits - Add credits to user
	fastify.post<{ Params: { id: string }; Body: { amount: number; reason: string } }>(
		"/api/admin/users/:id/credits",
		async (request, reply) => {
			const db = getDb();
			const { id } = request.params;
			const { amount, reason } = request.body;

			const user = db.prepare("SELECT id FROM users WHERE id = ?").get(id);
			if (!user) {
				return reply.status(404).send({ error: "User not found" });
			}

			if (!amount || amount === 0) {
				return reply.status(400).send({ error: "Amount is required and must be non-zero" });
			}

			addCredits(
				id,
				amount,
				amount > 0 ? "admin_grant" : "admin_deduct",
				reason || "Admin adjustment",
			);

			const credits = db
				.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM user_credits WHERE user_id = ?")
				.get(id) as CreditRow;

			return { success: true, newBalance: credits.total };
		},
	);

	// POST /api/admin/users/:id/subscription - Assign subscription to user
	fastify.post<{ Params: { id: string }; Body: { productId: string } }>(
		"/api/admin/users/:id/subscription",
		async (request, reply) => {
			const db = getDb();
			const { id } = request.params;
			const { productId } = request.body;

			const user = db.prepare("SELECT id FROM users WHERE id = ?").get(id);
			if (!user) {
				return reply.status(404).send({ error: "User not found" });
			}

			const product = db
				.prepare("SELECT id FROM subscription_products WHERE id = ? AND is_active = 1")
				.get(productId);
			if (!product) {
				return reply.status(404).send({ error: "Product not found" });
			}

			const subscriptionId = assignSubscription(id, productId);

			return { success: true, subscriptionId };
		},
	);

	// GET /api/admin/products - List subscription products
	fastify.get("/api/admin/products", async () => {
		const db = getDb();

		const products = db
			.prepare("SELECT * FROM subscription_products ORDER BY price ASC, created_at ASC")
			.all() as ProductRow[];

		// Get user count for each product
		const productsWithStats = products.map((product) => {
			const userCount = db
				.prepare(
					`SELECT COUNT(DISTINCT user_id) as count
				FROM user_subscriptions
				WHERE product_id = ? AND (ends_at IS NULL OR ends_at > datetime('now'))`,
				)
				.get(product.id) as { count: number };

			return {
				id: product.id,
				name: product.name,
				description: product.description,
				monthlyImageLimit: product.monthly_image_limit,
				monthlyCostLimit: product.monthly_cost_limit,
				dailyImageLimit: product.daily_image_limit,
				bonusCredits: product.bonus_credits,
				price: product.price,
				isActive: product.is_active === 1,
				createdAt: product.created_at,
				activeUsers: userCount.count,
			};
		});

		return { products: productsWithStats };
	});

	// POST /api/admin/products - Create subscription product
	fastify.post<{
		Body: {
			name: string;
			description?: string;
			monthlyImageLimit?: number;
			monthlyCostLimit?: number;
			dailyImageLimit?: number;
			bonusCredits?: number;
			price?: number;
		};
	}>("/api/admin/products", async (request, reply) => {
		const db = getDb();
		const { name, description, monthlyImageLimit, monthlyCostLimit, dailyImageLimit, bonusCredits, price } =
			request.body;

		if (!name) {
			return reply.status(400).send({ error: "Name is required" });
		}

		const id = crypto.randomUUID();

		db.prepare(
			`INSERT INTO subscription_products
			(id, name, description, monthly_image_limit, monthly_cost_limit, daily_image_limit, bonus_credits, price)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		).run(
			id,
			name,
			description || null,
			monthlyImageLimit ?? null,
			monthlyCostLimit ?? null,
			dailyImageLimit ?? null,
			bonusCredits ?? 0,
			price ?? 0,
		);

		return {
			id,
			name,
			description: description || null,
			monthlyImageLimit: monthlyImageLimit ?? null,
			monthlyCostLimit: monthlyCostLimit ?? null,
			dailyImageLimit: dailyImageLimit ?? null,
			bonusCredits: bonusCredits ?? 0,
			price: price ?? 0,
			isActive: true,
		};
	});

	// PATCH /api/admin/products/:id - Update subscription product
	fastify.patch<{
		Params: { id: string };
		Body: {
			name?: string;
			description?: string;
			monthlyImageLimit?: number | null;
			monthlyCostLimit?: number | null;
			dailyImageLimit?: number | null;
			bonusCredits?: number;
			price?: number;
			isActive?: boolean;
		};
	}>("/api/admin/products/:id", async (request, reply) => {
		const db = getDb();
		const { id } = request.params;
		const {
			name,
			description,
			monthlyImageLimit,
			monthlyCostLimit,
			dailyImageLimit,
			bonusCredits,
			price,
			isActive,
		} = request.body;

		const product = db.prepare("SELECT id FROM subscription_products WHERE id = ?").get(id);
		if (!product) {
			return reply.status(404).send({ error: "Product not found" });
		}

		const updates: string[] = [];
		const params: unknown[] = [];

		if (name !== undefined) {
			updates.push("name = ?");
			params.push(name);
		}
		if (description !== undefined) {
			updates.push("description = ?");
			params.push(description || null);
		}
		if (monthlyImageLimit !== undefined) {
			updates.push("monthly_image_limit = ?");
			params.push(monthlyImageLimit);
		}
		if (monthlyCostLimit !== undefined) {
			updates.push("monthly_cost_limit = ?");
			params.push(monthlyCostLimit);
		}
		if (dailyImageLimit !== undefined) {
			updates.push("daily_image_limit = ?");
			params.push(dailyImageLimit);
		}
		if (bonusCredits !== undefined) {
			updates.push("bonus_credits = ?");
			params.push(bonusCredits);
		}
		if (price !== undefined) {
			updates.push("price = ?");
			params.push(price);
		}
		if (isActive !== undefined) {
			updates.push("is_active = ?");
			params.push(isActive ? 1 : 0);
		}

		if (updates.length > 0) {
			params.push(id);
			db.prepare(`UPDATE subscription_products SET ${updates.join(", ")} WHERE id = ?`).run(
				...params,
			);
		}

		return { success: true };
	});

	// DELETE /api/admin/products/:id - Deactivate subscription product
	fastify.delete<{ Params: { id: string } }>("/api/admin/products/:id", async (request, reply) => {
		const db = getDb();
		const { id } = request.params;

		const product = db.prepare("SELECT id FROM subscription_products WHERE id = ?").get(id);
		if (!product) {
			return reply.status(404).send({ error: "Product not found" });
		}

		// Soft delete by deactivating
		db.prepare("UPDATE subscription_products SET is_active = 0 WHERE id = ?").run(id);

		return { success: true };
	});

	// POST /api/admin/costs/recalculate - Recalculate costs for historical generations
	fastify.post<{ Body: { dryRun?: boolean } }>(
		"/api/admin/costs/recalculate",
		async (request, reply) => {
			const db = getDb();
			const dryRun = request.body?.dryRun ?? true;

			// Get all generations
			const generations = db
				.prepare(
					`SELECT id, model, width, height, parameters, cost
					FROM generations
					WHERE deleted_at IS NULL`,
				)
				.all() as GenerationRow[];

			let oldTotalCost = 0;
			let newTotalCost = 0;
			const updates: { id: string; model: string; oldCost: number; newCost: number }[] = [];

			for (const gen of generations) {
				oldTotalCost += gen.cost || 0;

				// Parse parameters to get resolution if available
				let resolution: string | undefined;
				if (gen.parameters) {
					try {
						const params = JSON.parse(gen.parameters);
						resolution = params.resolution;
					} catch {
						// Ignore parse errors
					}
				}

				const newCost = calculateGenerationCost(gen.model, {
					numOutputs: 1,
					resolution,
					width: gen.width || undefined,
					height: gen.height || undefined,
				});

				newTotalCost += newCost;

				if (Math.abs((gen.cost || 0) - newCost) > 0.0001) {
					updates.push({
						id: gen.id,
						model: gen.model,
						oldCost: gen.cost || 0,
						newCost,
					});
				}
			}

			// Apply updates if not dry run
			if (!dryRun && updates.length > 0) {
				const updateStmt = db.prepare("UPDATE generations SET cost = ? WHERE id = ?");
				for (const update of updates) {
					updateStmt.run(update.newCost, update.id);
				}

				// Recalculate usage_monthly totals
				const monthlyRecalc = db.prepare(`
					UPDATE usage_monthly
					SET total_cost = (
						SELECT COALESCE(SUM(g.cost), 0)
						FROM generations g
						WHERE g.user_id = usage_monthly.user_id
						AND strftime('%Y-%m', g.created_at) = usage_monthly.year_month
					)
				`);
				monthlyRecalc.run();
			}

			// Summarize by model
			const summaryByModel: Record<string, { count: number; oldTotal: number; newTotal: number }> =
				{};
			for (const update of updates) {
				if (!summaryByModel[update.model]) {
					summaryByModel[update.model] = { count: 0, oldTotal: 0, newTotal: 0 };
				}
				summaryByModel[update.model].count++;
				summaryByModel[update.model].oldTotal += update.oldCost;
				summaryByModel[update.model].newTotal += update.newCost;
			}

			return {
				dryRun,
				totalGenerations: generations.length,
				generationsUpdated: updates.length,
				oldTotalCost: Math.round(oldTotalCost * 10000) / 10000,
				newTotalCost: Math.round(newTotalCost * 10000) / 10000,
				costDifference: Math.round((newTotalCost - oldTotalCost) * 10000) / 10000,
				summaryByModel: Object.entries(summaryByModel).map(([model, data]) => ({
					model,
					count: data.count,
					oldTotal: Math.round(data.oldTotal * 10000) / 10000,
					newTotal: Math.round(data.newTotal * 10000) / 10000,
					difference: Math.round((data.newTotal - data.oldTotal) * 10000) / 10000,
				})),
			};
		},
	);

	// GET /api/admin/costs/pricing - Get current model pricing configuration
	fastify.get("/api/admin/costs/pricing", async () => {
		// Import the pricing map from replicate service
		// We'll calculate sample costs for common scenarios
		const models = [
			"black-forest-labs/flux-schnell",
			"black-forest-labs/flux-dev",
			"black-forest-labs/flux-1.1-pro",
			"black-forest-labs/flux-1.1-pro-ultra",
			"black-forest-labs/flux-2-pro",
			"black-forest-labs/flux-2-dev",
			"black-forest-labs/flux-redux-schnell",
			"black-forest-labs/flux-redux-dev",
			"black-forest-labs/flux-kontext-pro",
			"google/nano-banana-pro",
		];

		const pricing = models.map((model) => ({
			model,
			costPerImage1MP: calculateGenerationCost(model, { numOutputs: 1 }),
			costPerImage2MP: calculateGenerationCost(model, {
				numOutputs: 1,
				resolution: "2 MP",
			}),
			costPerImage4MP: calculateGenerationCost(model, {
				numOutputs: 1,
				resolution: "4 MP",
			}),
		}));

		return { pricing };
	});
}
