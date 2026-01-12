import crypto from "node:crypto";
import type { FastifyInstance } from "fastify";
import { getDb } from "../db";
import { adminMiddleware, authMiddleware, signToken } from "../middleware/auth";
import { sendMagicLinkEmail, sendPasswordResetEmail } from "../services/email";
import { createEmailToken, markTokenUsed, validateToken } from "../services/tokens";
import { assignDefaultSubscription } from "../services/usage";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin";
const MAGIC_LINK_EXPIRY_MINUTES = Number(process.env.MAGIC_LINK_EXPIRY_MINUTES) || 15;
const PASSWORD_RESET_EXPIRY_MINUTES = Number(process.env.PASSWORD_RESET_EXPIRY_MINUTES) || 60;

// Simple password hashing using crypto
function hashPassword(password: string): string {
	return crypto.createHash("sha256").update(password).digest("hex");
}

function verifyPassword(password: string, hash: string): boolean {
	return hashPassword(password) === hash;
}

interface LoginBody {
	username: string;
	password: string;
}

interface EmailLoginBody {
	email: string;
	password: string;
	rememberMe?: boolean;
}

interface CheckEmailBody {
	email: string;
}

interface MagicLinkBody {
	email: string;
	rememberMe?: boolean;
}

interface ForgotPasswordBody {
	email: string;
}

interface ResetPasswordBody {
	token: string;
	newPassword: string;
}

interface RegisterBody {
	username: string;
	password: string;
	isAdmin?: boolean;
}

interface UserRow {
	id: string;
	username: string;
	email: string | null;
	password_hash: string;
	is_admin: number;
}

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
	// Create initial admin user if none exists
	const db = getDb();
	const adminExists = db.prepare("SELECT id FROM users WHERE is_admin = 1").get();
	if (!adminExists) {
		const id = crypto.randomUUID();
		db.prepare(
			"INSERT INTO users (id, username, password_hash, is_admin, is_active) VALUES (?, ?, ?, 1, 1)",
		).run(id, "admin", hashPassword(ADMIN_PASSWORD));
		// Assign default subscription to admin
		assignDefaultSubscription(id);
		console.log("Created initial admin user: admin");
	}

	// Login
	fastify.post<{ Body: LoginBody }>("/api/login", async (request, reply) => {
		const { username, password } = request.body;

		if (!username || !password) {
			return reply.status(400).send({ error: "Username and password required" });
		}

		const db = getDb();
		const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username) as
			| UserRow
			| undefined;

		if (!user || !verifyPassword(password, user.password_hash)) {
			return reply.status(401).send({ error: "Invalid username or password" });
		}

		// Update last_login timestamp
		db.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(user.id);

		const token = signToken({
			userId: user.id,
			username: user.username,
			isAdmin: user.is_admin === 1,
		});

		return {
			token,
			user: {
				id: user.id,
				username: user.username,
				isAdmin: user.is_admin === 1,
			},
		};
	});

	// Register (admin only)
	fastify.post<{ Body: RegisterBody }>(
		"/api/register",
		{ preHandler: adminMiddleware },
		async (request, reply) => {
			const { username, password, isAdmin } = request.body;

			if (!username || !password) {
				return reply.status(400).send({ error: "Username and password required" });
			}

			if (password.length < 6) {
				return reply.status(400).send({ error: "Password must be at least 6 characters" });
			}

			const db = getDb();

			// Check if username exists
			const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
			if (existing) {
				return reply.status(409).send({ error: "Username already exists" });
			}

			const id = crypto.randomUUID();
			db.prepare(
				"INSERT INTO users (id, username, password_hash, is_admin, is_active) VALUES (?, ?, ?, ?, 1)",
			).run(id, username, hashPassword(password), isAdmin ? 1 : 0);

			// Assign default subscription to new user
			assignDefaultSubscription(id);

			return {
				user: {
					id,
					username,
					isAdmin: !!isAdmin,
				},
			};
		},
	);

	// Get current user
	fastify.get("/api/me", { preHandler: authMiddleware }, async (request) => {
		return {
			user: request.user,
		};
	});

	// ==================== Email-First Auth Endpoints ====================

	// Check if email exists and has password
	fastify.post<{ Body: CheckEmailBody }>("/api/auth/check-email", async (request, reply) => {
		const { email } = request.body;

		if (!email) {
			return reply.status(400).send({ error: "Email required" });
		}

		const db = getDb();
		const user = db
			.prepare("SELECT id, username, password_hash FROM users WHERE email = ?")
			.get(email) as Pick<UserRow, "id" | "username" | "password_hash"> | undefined;

		if (!user) {
			return { exists: false, hasPassword: false };
		}

		return {
			exists: true,
			hasPassword: !!user.password_hash,
			username: user.username,
		};
	});

	// Login with email and password
	fastify.post<{ Body: EmailLoginBody }>("/api/auth/login-email", async (request, reply) => {
		const { email, password, rememberMe } = request.body;

		if (!email || !password) {
			return reply.status(400).send({ error: "Email and password required" });
		}

		const db = getDb();
		const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as
			| UserRow
			| undefined;

		if (!user || !user.password_hash || !verifyPassword(password, user.password_hash)) {
			return reply.status(401).send({ error: "Invalid email or password" });
		}

		// Update last_login timestamp
		db.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(user.id);

		const token = signToken(
			{
				userId: user.id,
				username: user.username,
				isAdmin: user.is_admin === 1,
			},
			rememberMe,
		);

		return {
			token,
			user: {
				id: user.id,
				username: user.username,
				isAdmin: user.is_admin === 1,
			},
		};
	});

	// Request magic link email
	fastify.post<{ Body: MagicLinkBody }>("/api/auth/magic-link", async (request, reply) => {
		const { email, rememberMe } = request.body;

		if (!email) {
			return reply.status(400).send({ error: "Email required" });
		}

		const db = getDb();
		const user = db.prepare("SELECT id, username, email FROM users WHERE email = ?").get(email) as
			| Pick<UserRow, "id" | "username" | "email">
			| undefined;

		if (!user) {
			// Return success even if user doesn't exist (prevent enumeration)
			return { success: true, message: "If an account exists, a magic link has been sent" };
		}

		// Create token
		const token = createEmailToken({
			userId: user.id,
			type: "magic_link",
			rememberMe: rememberMe || false,
			expiresInMinutes: MAGIC_LINK_EXPIRY_MINUTES,
		});

		// Send email
		await sendMagicLinkEmail(user.email || email, user.username, token, rememberMe || false);

		return { success: true, message: "Check your email for a login link" };
	});

	// Verify magic link token
	fastify.get<{ Querystring: { token: string } }>(
		"/api/auth/magic-link/verify",
		async (request, reply) => {
			const { token } = request.query;

			if (!token) {
				return reply.status(400).send({ error: "Token required" });
			}

			const validation = validateToken(token, "magic_link");

			if (!validation.valid) {
				return reply.status(401).send({ error: validation.error });
			}

			// Mark token as used
			markTokenUsed(token);

			// Get user info
			const db = getDb();
			const user = db
				.prepare("SELECT id, username, is_admin FROM users WHERE id = ?")
				.get(validation.userId) as Pick<UserRow, "id" | "username" | "is_admin"> | undefined;

			if (!user) {
				return reply.status(401).send({ error: "User not found" });
			}

			// Update last_login timestamp
			db.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(user.id);

			// Generate JWT
			const jwtToken = signToken(
				{
					userId: user.id,
					username: user.username,
					isAdmin: user.is_admin === 1,
				},
				validation.rememberMe,
			);

			return {
				token: jwtToken,
				user: {
					id: user.id,
					username: user.username,
					isAdmin: user.is_admin === 1,
				},
			};
		},
	);

	// Request password reset
	fastify.post<{ Body: ForgotPasswordBody }>("/api/auth/forgot-password", async (request) => {
		const { email } = request.body;

		if (!email) {
			// Always return success to prevent enumeration
			return { success: true };
		}

		const db = getDb();
		const user = db.prepare("SELECT id, username, email FROM users WHERE email = ?").get(email) as
			| Pick<UserRow, "id" | "username" | "email">
			| undefined;

		if (user) {
			// Create token
			const token = createEmailToken({
				userId: user.id,
				type: "password_reset",
				expiresInMinutes: PASSWORD_RESET_EXPIRY_MINUTES,
			});

			// Send email
			await sendPasswordResetEmail(user.email || email, user.username, token);
		}

		// Always return success
		return { success: true };
	});

	// Verify password reset token (check validity before showing form)
	fastify.get<{ Querystring: { token: string } }>(
		"/api/auth/verify-reset-token",
		async (request, reply) => {
			const { token } = request.query;

			if (!token) {
				return reply.status(400).send({ error: "Token required", valid: false });
			}

			const validation = validateToken(token, "password_reset");

			if (!validation.valid) {
				return { valid: false, error: validation.error };
			}

			// Get user email for display
			const db = getDb();
			const user = db.prepare("SELECT email FROM users WHERE id = ?").get(validation.userId) as
				| { email: string }
				| undefined;

			return { valid: true, email: user?.email };
		},
	);

	// Reset password with token
	fastify.post<{ Body: ResetPasswordBody }>("/api/auth/reset-password", async (request, reply) => {
		const { token, newPassword } = request.body;

		if (!token || !newPassword) {
			return reply.status(400).send({ error: "Token and new password required" });
		}

		if (newPassword.length < 6) {
			return reply.status(400).send({ error: "Password must be at least 6 characters" });
		}

		const validation = validateToken(token, "password_reset");

		if (!validation.valid) {
			return reply.status(401).send({ error: validation.error });
		}

		// Update password
		const db = getDb();
		db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(
			hashPassword(newPassword),
			validation.userId,
		);

		// Mark token as used
		markTokenUsed(token);

		return { success: true };
	});
}
