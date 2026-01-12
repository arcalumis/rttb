import type { FastifyInstance } from "fastify";
import { getDb } from "../db";
import { adminMiddleware } from "../middleware/auth";
import {
	calculateMetrics,
	computePeriodSnapshot,
	generateProfitLossStatement,
	getCostsByModel,
	getMetricsWithComparison,
	getRevenueByTier,
	getRevenueTrend,
	getTopCustomers,
} from "../services/financial-reports";
import { getCostSummary, reconcileAllCosts } from "../services/replicate-billing";

interface DateRangeQuery {
	startDate?: string;
	endDate?: string;
	period?: "mtd" | "qtd" | "ytd" | "last30" | "last90" | "custom";
}

interface TrendQuery {
	type?: "daily" | "weekly" | "monthly";
	count?: string;
}

function getDateRange(query: DateRangeQuery): { start: Date; end: Date } {
	const now = new Date();
	let start: Date;
	let end = new Date();

	switch (query.period) {
		case "mtd":
			start = new Date(now.getFullYear(), now.getMonth(), 1);
			break;
		case "qtd": {
			const quarter = Math.floor(now.getMonth() / 3);
			start = new Date(now.getFullYear(), quarter * 3, 1);
			break;
		}
		case "ytd":
			start = new Date(now.getFullYear(), 0, 1);
			break;
		case "last30":
			start = new Date(now);
			start.setDate(start.getDate() - 30);
			break;
		case "last90":
			start = new Date(now);
			start.setDate(start.getDate() - 90);
			break;
		case "custom":
			if (query.startDate && query.endDate) {
				start = new Date(query.startDate);
				end = new Date(query.endDate);
			} else {
				start = new Date(now.getFullYear(), now.getMonth(), 1);
			}
			break;
		default:
			start = new Date(now.getFullYear(), now.getMonth(), 1);
	}

	return { start, end };
}

export async function adminFinancialsRoutes(fastify: FastifyInstance): Promise<void> {
	// Dashboard overview
	fastify.get<{ Querystring: DateRangeQuery }>(
		"/api/admin/financials/overview",
		{ preHandler: adminMiddleware },
		async (request) => {
			const { start, end } = getDateRange(request.query);
			const metrics = calculateMetrics(start, end);

			return {
				period: {
					start: start.toISOString(),
					end: end.toISOString(),
				},
				revenue: metrics.revenue,
				costs: metrics.costs,
				profit: metrics.profit,
				subscribers: metrics.subscribers,
				mrr: metrics.mrr,
				arr: metrics.arr,
				ltv: metrics.ltv,
				generations: metrics.generations,
				avgCostPerGeneration: metrics.avgCostPerGeneration,
			};
		},
	);

	// Metrics with period comparison
	fastify.get(
		"/api/admin/financials/comparison/:periodType",
		{ preHandler: adminMiddleware },
		async (request) => {
			const { periodType } = request.params as { periodType: string };

			if (!["daily", "monthly", "quarterly", "yearly"].includes(periodType)) {
				return { error: "Invalid period type" };
			}

			const comparison = getMetricsWithComparison(
				periodType as "daily" | "monthly" | "quarterly" | "yearly",
			);

			return comparison;
		},
	);

	// Revenue breakdown by subscription tier
	fastify.get<{ Querystring: DateRangeQuery }>(
		"/api/admin/financials/revenue/by-tier",
		{ preHandler: adminMiddleware },
		async (request) => {
			const { start, end } = getDateRange(request.query);
			const byTier = getRevenueByTier(start, end);

			return {
				period: {
					start: start.toISOString(),
					end: end.toISOString(),
				},
				tiers: byTier,
			};
		},
	);

	// Top customers by revenue
	fastify.get<{ Querystring: DateRangeQuery & { limit?: string } }>(
		"/api/admin/financials/revenue/top-customers",
		{ preHandler: adminMiddleware },
		async (request) => {
			const { start, end } = getDateRange(request.query);
			const limit = Math.min(50, Math.max(1, Number.parseInt(request.query.limit || "10", 10)));
			const topCustomers = getTopCustomers(start, end, limit);

			return {
				period: {
					start: start.toISOString(),
					end: end.toISOString(),
				},
				customers: topCustomers,
			};
		},
	);

	// Cost breakdown by model
	fastify.get<{ Querystring: DateRangeQuery }>(
		"/api/admin/financials/costs/by-model",
		{ preHandler: adminMiddleware },
		async (request) => {
			const { start, end } = getDateRange(request.query);
			const byModel = getCostsByModel(start, end);

			return {
				period: {
					start: start.toISOString(),
					end: end.toISOString(),
				},
				models: byModel,
			};
		},
	);

	// Cost summary (from replicate-billing)
	fastify.get<{ Querystring: DateRangeQuery }>(
		"/api/admin/financials/costs/summary",
		{ preHandler: adminMiddleware },
		async (request) => {
			const { start, end } = getDateRange(request.query);
			const summary = getCostSummary(start, end);

			return {
				period: {
					start: start.toISOString(),
					end: end.toISOString(),
				},
				...summary,
			};
		},
	);

	// Revenue/profit trend
	fastify.get<{ Querystring: TrendQuery }>(
		"/api/admin/financials/trend",
		{ preHandler: adminMiddleware },
		async (request) => {
			const type = (request.query.type || "monthly") as "daily" | "weekly" | "monthly";
			const count = Math.min(365, Math.max(1, Number.parseInt(request.query.count || "12", 10)));

			const trend = getRevenueTrend(type, count);

			return {
				type,
				data: trend,
			};
		},
	);

	// P&L statement
	fastify.get<{ Querystring: DateRangeQuery }>(
		"/api/admin/financials/pnl",
		{ preHandler: adminMiddleware },
		async (request) => {
			const { start, end } = getDateRange(request.query);
			const pnl = generateProfitLossStatement(start, end);

			return {
				period: {
					start: start.toISOString(),
					end: end.toISOString(),
				},
				...pnl,
			};
		},
	);

	// MRR/ARR history
	fastify.get(
		"/api/admin/financials/mrr-history",
		{ preHandler: adminMiddleware },
		async () => {
			const db = getDb();

			const history = db
				.prepare(`
					SELECT
						period_start,
						mrr_cents / 100.0 as mrr,
						active_subscribers,
						new_subscribers,
						churned_subscribers
					FROM financial_periods
					WHERE period_type = 'monthly'
					ORDER BY period_start DESC
					LIMIT 12
				`)
				.all() as Array<{
				period_start: string;
				mrr: number;
				active_subscribers: number;
				new_subscribers: number;
				churned_subscribers: number;
			}>;

			return {
				history: history.reverse(),
			};
		},
	);

	// Churn analysis
	fastify.get<{ Querystring: DateRangeQuery }>(
		"/api/admin/financials/churn",
		{ preHandler: adminMiddleware },
		async (request) => {
			const { start, end } = getDateRange(request.query);
			const db = getDb();

			// Get churned users in period
			const churned = db
				.prepare(`
					SELECT
						u.username,
						u.email,
						um.first_payment_at,
						um.churned_at,
						um.total_paid_cents / 100.0 as total_paid,
						um.subscription_months
					FROM user_metrics um
					JOIN users u ON um.user_id = u.id
					WHERE um.churned_at >= ? AND um.churned_at < ?
					ORDER BY um.churned_at DESC
				`)
				.all(start.toISOString(), end.toISOString()) as Array<{
				username: string;
				email: string | null;
				first_payment_at: string | null;
				churned_at: string;
				total_paid: number;
				subscription_months: number;
			}>;

			// Calculate churn rate
			const activeStart = db
				.prepare(`
					SELECT COUNT(DISTINCT user_id) as count
					FROM user_subscriptions
					WHERE status = 'active' AND created_at < ?
				`)
				.get(start.toISOString()) as { count: number };

			const churnRate = activeStart.count > 0 ? (churned.length / activeStart.count) * 100 : 0;

			return {
				period: {
					start: start.toISOString(),
					end: end.toISOString(),
				},
				churnedCount: churned.length,
				churnRate,
				churnedUsers: churned.map((c) => ({
					username: c.username,
					email: c.email,
					firstPayment: c.first_payment_at,
					churnedAt: c.churned_at,
					totalPaid: c.total_paid,
					subscriptionMonths: c.subscription_months,
				})),
			};
		},
	);

	// Trigger cost reconciliation manually
	fastify.post(
		"/api/admin/financials/reconcile-costs",
		{ preHandler: adminMiddleware },
		async () => {
			const result = await reconcileAllCosts(500);
			return result;
		},
	);

	// Compute period snapshots
	fastify.post<{ Body: { periodType: string } }>(
		"/api/admin/financials/snapshot",
		{ preHandler: adminMiddleware },
		async (request) => {
			const { periodType } = request.body;

			if (!["daily", "monthly", "quarterly", "yearly"].includes(periodType)) {
				return { error: "Invalid period type" };
			}

			computePeriodSnapshot(periodType as "daily" | "monthly" | "quarterly" | "yearly");

			return { success: true };
		},
	);

	// All-time stats summary
	fastify.get(
		"/api/admin/financials/all-time",
		{ preHandler: adminMiddleware },
		async () => {
			const db = getDb();

			// Total revenue all time
			const totalRevenue = db
				.prepare(
					"SELECT SUM(amount_cents) / 100.0 as total FROM revenue_events WHERE amount_cents > 0",
				)
				.get() as { total: number | null };

			// Total costs all time
			const totalCosts = db
				.prepare("SELECT SUM(COALESCE(actual_cost, estimated_cost)) as total FROM platform_costs")
				.get() as { total: number | null };

			// Total generations
			const totalGenerations = db
				.prepare("SELECT COUNT(*) as count FROM generations WHERE purged_at IS NULL")
				.get() as { count: number };

			// Total users
			const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users").get() as {
				count: number;
			};

			// Paying customers (ever)
			const payingCustomers = db
				.prepare("SELECT COUNT(DISTINCT user_id) as count FROM payments WHERE status = 'succeeded'")
				.get() as { count: number };

			return {
				totalRevenue: totalRevenue.total || 0,
				totalCosts: totalCosts.total || 0,
				totalProfit: (totalRevenue.total || 0) - (totalCosts.total || 0),
				totalGenerations: totalGenerations.count,
				totalUsers: totalUsers.count,
				payingCustomers: payingCustomers.count,
			};
		},
	);
}
