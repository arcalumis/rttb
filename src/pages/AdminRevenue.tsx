import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../config";
import { useAuth } from "../contexts/AuthContext";

interface TierRevenue {
	tier: string;
	revenue: number;
	subscribers: number;
}

interface TopCustomer {
	userId: string;
	username: string;
	email: string | null;
	revenue: number;
	generations: number;
}

type PeriodOption = "mtd" | "qtd" | "ytd" | "last30" | "last90";

export function AdminRevenue() {
	const { token } = useAuth();
	const [period, setPeriod] = useState<PeriodOption>("mtd");
	const [byTier, setByTier] = useState<TierRevenue[]>([]);
	const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
	const [loading, setLoading] = useState(true);

	const fetchData = useCallback(async () => {
		if (!token) return;

		setLoading(true);
		try {
			const headers = { Authorization: `Bearer ${token}` };

			const [tierRes, customersRes] = await Promise.all([
				fetch(`${API_BASE}/api/admin/financials/revenue/by-tier?period=${period}`, { headers }),
				fetch(`${API_BASE}/api/admin/financials/revenue/top-customers?period=${period}&limit=20`, { headers }),
			]);

			if (tierRes.ok) {
				const data = await tierRes.json();
				setByTier(data.tiers || []);
			}

			if (customersRes.ok) {
				const data = await customersRes.json();
				setTopCustomers(data.customers || []);
			}
		} catch (err) {
			console.error("Failed to fetch revenue data:", err);
		} finally {
			setLoading(false);
		}
	}, [token, period]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
		}).format(value);
	};

	const periodLabels: Record<PeriodOption, string> = {
		mtd: "Month to Date",
		qtd: "Quarter to Date",
		ytd: "Year to Date",
		last30: "Last 30 Days",
		last90: "Last 90 Days",
	};

	const totalRevenue = byTier.reduce((sum, t) => sum + t.revenue, 0);

	return (
		<div className="p-4 space-y-4">
			{/* Header */}
			<div className="flex justify-between items-center">
				<div>
					<div className="flex items-center gap-2">
						<Link to="/admin/financials" className="text-gray-400 hover:text-cyan-400">
							Financials
						</Link>
						<span className="text-gray-600">/</span>
						<h1 className="text-xl font-bold text-white">Revenue Details</h1>
					</div>
					<p className="text-xs text-gray-400">Revenue breakdown by tier and customer</p>
				</div>
				<select
					value={period}
					onChange={(e) => setPeriod(e.target.value as PeriodOption)}
					className="cyber-input text-xs py-1 px-2"
				>
					{Object.entries(periodLabels).map(([value, label]) => (
						<option key={value} value={value}>
							{label}
						</option>
					))}
				</select>
			</div>

			{loading ? (
				<div className="flex items-center justify-center h-64">
					<div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500" />
				</div>
			) : (
				<div className="grid lg:grid-cols-2 gap-4">
					{/* Revenue by Tier */}
					<div className="cyber-card p-4">
						<h2 className="text-sm font-semibold text-white mb-3">Revenue by Subscription Tier</h2>
						{byTier.length > 0 ? (
							<div className="space-y-3">
								{byTier.map((tier) => {
									const percent = totalRevenue > 0 ? (tier.revenue / totalRevenue) * 100 : 0;
									return (
										<div key={tier.tier}>
											<div className="flex justify-between text-sm mb-1">
												<span className="text-white">{tier.tier}</span>
												<span className="text-cyan-400">{formatCurrency(tier.revenue)}</span>
											</div>
											<div className="h-2 bg-gray-800 rounded-full overflow-hidden">
												<div
													className="h-full bg-gradient-to-r from-cyan-500 to-pink-500 rounded-full"
													style={{ width: `${percent}%` }}
												/>
											</div>
											<div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
												<span>{tier.subscribers} subscribers</span>
												<span>{percent.toFixed(1)}%</span>
											</div>
										</div>
									);
								})}
								<div className="pt-2 border-t border-cyan-500/20">
									<div className="flex justify-between text-sm">
										<span className="text-gray-400">Total Revenue</span>
										<span className="text-green-400 font-bold">{formatCurrency(totalRevenue)}</span>
									</div>
								</div>
							</div>
						) : (
							<p className="text-gray-500 text-sm">No revenue data for this period</p>
						)}
					</div>

					{/* Top Customers */}
					<div className="cyber-card p-4">
						<h2 className="text-sm font-semibold text-white mb-3">Top Customers by Revenue</h2>
						{topCustomers.length > 0 ? (
							<div className="space-y-2 max-h-80 overflow-y-auto">
								{topCustomers.map((customer, index) => (
									<div
										key={customer.userId}
										className="flex items-center justify-between p-2 bg-black/30 rounded"
									>
										<div className="flex items-center gap-3">
											<span className="text-[10px] text-gray-500 w-4">{index + 1}</span>
											<div>
												<p className="text-sm text-white">{customer.username}</p>
												<p className="text-[10px] text-gray-500">
													{customer.email || "No email"} · {customer.generations} generations
												</p>
											</div>
										</div>
										<span className="text-sm text-green-400 font-medium">
											{formatCurrency(customer.revenue)}
										</span>
									</div>
								))}
							</div>
						) : (
							<p className="text-gray-500 text-sm">No customer revenue data for this period</p>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
