import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../config";
import { useAuth } from "../contexts/AuthContext";

interface MRRHistory {
	period_start: string;
	mrr: number;
	active_subscribers: number;
	new_subscribers: number;
	churned_subscribers: number;
}

interface ChurnData {
	churnedCount: number;
	churnRate: number;
	churnedUsers: Array<{
		username: string;
		email: string | null;
		firstPayment: string | null;
		churnedAt: string;
		totalPaid: number;
		subscriptionMonths: number;
	}>;
}

interface ComparisonData {
	current: {
		mrr: number;
		arr: number;
		ltv: number;
		subscribers: { active: number; churnRate: number };
		avgRevenuePerUser: number;
	};
	previous: {
		mrr: number;
		arr: number;
		ltv: number;
		subscribers: { active: number; churnRate: number };
		avgRevenuePerUser: number;
	};
	changes: {
		mrr: number;
		subscribers: number;
	};
}

type PeriodOption = "mtd" | "qtd" | "ytd" | "last30" | "last90";

export function AdminMetrics() {
	const { token } = useAuth();
	const [period, setPeriod] = useState<PeriodOption>("mtd");
	const [mrrHistory, setMrrHistory] = useState<MRRHistory[]>([]);
	const [churnData, setChurnData] = useState<ChurnData | null>(null);
	const [comparison, setComparison] = useState<ComparisonData | null>(null);
	const [loading, setLoading] = useState(true);

	const fetchData = useCallback(async () => {
		if (!token) return;

		setLoading(true);
		try {
			const headers = { Authorization: `Bearer ${token}` };

			const [mrrRes, churnRes, compRes] = await Promise.all([
				fetch(`${API_BASE}/api/admin/financials/mrr-history`, { headers }),
				fetch(`${API_BASE}/api/admin/financials/churn?period=${period}`, { headers }),
				fetch(`${API_BASE}/api/admin/financials/comparison/monthly`, { headers }),
			]);

			if (mrrRes.ok) {
				const data = await mrrRes.json();
				setMrrHistory(data.history || []);
			}

			if (churnRes.ok) {
				const data = await churnRes.json();
				setChurnData(data);
			}

			if (compRes.ok) {
				const data = await compRes.json();
				setComparison(data);
			}
		} catch (err) {
			console.error("Failed to fetch metrics data:", err);
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

	const formatChange = (value: number) => {
		const sign = value >= 0 ? "+" : "";
		return `${sign}${value.toFixed(1)}%`;
	};

	const periodLabels: Record<PeriodOption, string> = {
		mtd: "Month to Date",
		qtd: "Quarter to Date",
		ytd: "Year to Date",
		last30: "Last 30 Days",
		last90: "Last 90 Days",
	};

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
						<h1 className="text-xl font-bold text-white">Business Metrics</h1>
					</div>
					<p className="text-xs text-gray-400">MRR, ARR, LTV, and churn analysis</p>
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
				<>
					{/* Key Metrics with Comparison */}
					{comparison && (
						<div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
							<div className="cyber-card p-3">
								<p className="text-[10px] text-gray-400 uppercase">MRR</p>
								<p className="text-lg font-bold text-cyan-400">{formatCurrency(comparison.current.mrr)}</p>
								<p className={`text-[10px] ${comparison.changes.mrr >= 0 ? "text-green-400" : "text-red-400"}`}>
									{formatChange(comparison.changes.mrr)} vs last month
								</p>
							</div>
							<div className="cyber-card p-3">
								<p className="text-[10px] text-gray-400 uppercase">ARR</p>
								<p className="text-lg font-bold text-purple-400">{formatCurrency(comparison.current.arr)}</p>
								<p className="text-[10px] text-gray-500">MRR x 12</p>
							</div>
							<div className="cyber-card p-3">
								<p className="text-[10px] text-gray-400 uppercase">Customer LTV</p>
								<p className="text-lg font-bold text-green-400">{formatCurrency(comparison.current.ltv)}</p>
								<p className="text-[10px] text-gray-500">Lifetime value</p>
							</div>
							<div className="cyber-card p-3">
								<p className="text-[10px] text-gray-400 uppercase">ARPU</p>
								<p className="text-lg font-bold text-yellow-400">{formatCurrency(comparison.current.avgRevenuePerUser)}</p>
								<p className="text-[10px] text-gray-500">Avg revenue/user</p>
							</div>
							<div className="cyber-card p-3">
								<p className="text-[10px] text-gray-400 uppercase">Active Subs</p>
								<p className="text-lg font-bold text-white">{comparison.current.subscribers.active}</p>
								<p className={`text-[10px] ${comparison.changes.subscribers >= 0 ? "text-green-400" : "text-red-400"}`}>
									{formatChange(comparison.changes.subscribers)} vs last month
								</p>
							</div>
						</div>
					)}

					{/* MRR History Chart */}
					<div className="cyber-card p-4">
						<h2 className="text-sm font-semibold text-white mb-3">MRR History (12 Months)</h2>
						{mrrHistory.length > 0 ? (
							<div className="h-48">
								<div className="flex items-end justify-between h-40 gap-1">
									{mrrHistory.map((d, i) => {
										const maxMrr = Math.max(...mrrHistory.map((m) => m.mrr), 1);
										const height = (d.mrr / maxMrr) * 100;
										return (
											<div key={i} className="flex-1 flex flex-col items-center gap-1">
												<div className="text-[8px] text-gray-500">{formatCurrency(d.mrr)}</div>
												<div
													className="w-full bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t transition-all relative group"
													style={{ height: `${height}%`, minHeight: "4px" }}
												>
													<div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block bg-black/90 px-2 py-1 rounded text-[10px] whitespace-nowrap">
														<div className="text-cyan-400">{formatCurrency(d.mrr)}</div>
														<div className="text-gray-400">{d.active_subscribers} subs</div>
													</div>
												</div>
												<span className="text-[8px] text-gray-500 truncate">
													{d.period_start.slice(5, 7)}
												</span>
											</div>
										);
									})}
								</div>
							</div>
						) : (
							<p className="text-gray-500 text-sm">No MRR history data available</p>
						)}
					</div>

					<div className="grid lg:grid-cols-2 gap-4">
						{/* Subscriber Growth */}
						<div className="cyber-card p-4">
							<h2 className="text-sm font-semibold text-white mb-3">Subscriber Movement</h2>
							{mrrHistory.length > 0 ? (
								<div className="space-y-2">
									{mrrHistory.slice(-6).map((m) => (
										<div key={m.period_start} className="flex items-center justify-between text-sm">
											<span className="text-gray-400">{m.period_start}</span>
											<div className="flex gap-4">
												<span className="text-green-400">+{m.new_subscribers} new</span>
												<span className="text-red-400">-{m.churned_subscribers} churned</span>
												<span className="text-white font-medium">{m.active_subscribers} active</span>
											</div>
										</div>
									))}
								</div>
							) : (
								<p className="text-gray-500 text-sm">No subscriber data available</p>
							)}
						</div>

						{/* Churn Analysis */}
						<div className="cyber-card p-4">
							<h2 className="text-sm font-semibold text-white mb-3">Churn Analysis</h2>
							{churnData && (
								<div className="space-y-3">
									<div className="flex justify-between">
										<span className="text-gray-400">Churned Customers</span>
										<span className="text-red-400 font-bold">{churnData.churnedCount}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-gray-400">Churn Rate</span>
										<span className={`font-bold ${churnData.churnRate > 5 ? "text-red-400" : "text-green-400"}`}>
											{churnData.churnRate.toFixed(1)}%
										</span>
									</div>
									{churnData.churnedUsers.length > 0 && (
										<div className="pt-2 border-t border-cyan-500/20">
											<p className="text-[10px] text-gray-400 uppercase mb-2">Recently Churned</p>
											<div className="space-y-1 max-h-32 overflow-y-auto">
												{churnData.churnedUsers.slice(0, 5).map((user, i) => (
													<div key={i} className="flex justify-between text-xs">
														<span className="text-white">{user.username}</span>
														<span className="text-gray-500">
															{formatCurrency(user.totalPaid)} over {user.subscriptionMonths}mo
														</span>
													</div>
												))}
											</div>
										</div>
									)}
								</div>
							)}
						</div>
					</div>

					{/* LTV/CAC Analysis */}
					<div className="cyber-card p-4">
						<h2 className="text-sm font-semibold text-white mb-3">Unit Economics</h2>
						<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
							<div>
								<p className="text-[10px] text-gray-400 uppercase">LTV</p>
								<p className="text-xl font-bold text-green-400">
									{formatCurrency(comparison?.current.ltv || 0)}
								</p>
								<p className="text-[10px] text-gray-500">Customer lifetime value</p>
							</div>
							<div>
								<p className="text-[10px] text-gray-400 uppercase">ARPU</p>
								<p className="text-xl font-bold text-cyan-400">
									{formatCurrency(comparison?.current.avgRevenuePerUser || 0)}
								</p>
								<p className="text-[10px] text-gray-500">Avg revenue per user</p>
							</div>
							<div>
								<p className="text-[10px] text-gray-400 uppercase">Monthly Churn</p>
								<p className={`text-xl font-bold ${(comparison?.current.subscribers.churnRate || 0) > 5 ? "text-red-400" : "text-green-400"}`}>
									{(comparison?.current.subscribers.churnRate || 0).toFixed(1)}%
								</p>
								<p className="text-[10px] text-gray-500">Subscriber churn rate</p>
							</div>
							<div>
								<p className="text-[10px] text-gray-400 uppercase">Avg Lifespan</p>
								<p className="text-xl font-bold text-purple-400">
									{comparison?.current.subscribers.churnRate
										? Math.round(100 / comparison.current.subscribers.churnRate)
										: "∞"} mo
								</p>
								<p className="text-[10px] text-gray-500">1 / churn rate</p>
							</div>
						</div>
					</div>
				</>
			)}
		</div>
	);
}
