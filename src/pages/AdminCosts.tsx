import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../config";
import { useAuth } from "../contexts/AuthContext";

interface ModelCost {
	model: string;
	estimatedCost: number;
	actualCost: number;
	generations: number;
	avgCost: number;
}

interface CostSummary {
	totalEstimated: number;
	totalActual: number;
	totalGenerations: number;
	avgCostPerGeneration: number;
	costByModel: Record<string, { estimated: number; actual: number; count: number }>;
}

type PeriodOption = "mtd" | "qtd" | "ytd" | "last30" | "last90";

export function AdminCosts() {
	const { token } = useAuth();
	const [period, setPeriod] = useState<PeriodOption>("mtd");
	const [byModel, setByModel] = useState<ModelCost[]>([]);
	const [summary, setSummary] = useState<CostSummary | null>(null);
	const [reconciling, setReconciling] = useState(false);
	const [loading, setLoading] = useState(true);

	const fetchData = useCallback(async () => {
		if (!token) return;

		setLoading(true);
		try {
			const headers = { Authorization: `Bearer ${token}` };

			const [modelRes, summaryRes] = await Promise.all([
				fetch(`${API_BASE}/api/admin/financials/costs/by-model?period=${period}`, { headers }),
				fetch(`${API_BASE}/api/admin/financials/costs/summary?period=${period}`, { headers }),
			]);

			if (modelRes.ok) {
				const data = await modelRes.json();
				setByModel(data.models || []);
			}

			if (summaryRes.ok) {
				const data = await summaryRes.json();
				setSummary(data);
			}
		} catch (err) {
			console.error("Failed to fetch cost data:", err);
		} finally {
			setLoading(false);
		}
	}, [token, period]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const handleReconcile = async () => {
		if (!token || reconciling) return;

		setReconciling(true);
		try {
			const response = await fetch(`${API_BASE}/api/admin/financials/reconcile-costs`, {
				method: "POST",
				headers: { Authorization: `Bearer ${token}` },
			});

			if (response.ok) {
				const result = await response.json();
				alert(`Reconciled ${result.reconciled}/${result.processed} costs (${result.errors} errors)`);
				fetchData();
			}
		} catch (err) {
			console.error("Failed to reconcile costs:", err);
		} finally {
			setReconciling(false);
		}
	};

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
			minimumFractionDigits: 4,
			maximumFractionDigits: 4,
		}).format(value);
	};

	const formatCurrencyShort = (value: number) => {
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

	const totalCost = byModel.reduce((sum, m) => sum + m.actualCost, 0);

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
						<h1 className="text-xl font-bold text-white">Cost Analysis</h1>
					</div>
					<p className="text-xs text-gray-400">Platform costs and margin analysis</p>
				</div>
				<div className="flex gap-2">
					<button
						type="button"
						onClick={handleReconcile}
						disabled={reconciling}
						className="cyber-button text-xs py-1 px-3"
					>
						{reconciling ? "Reconciling..." : "Reconcile Costs"}
					</button>
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
			</div>

			{loading ? (
				<div className="flex items-center justify-center h-64">
					<div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500" />
				</div>
			) : (
				<>
					{/* Summary Cards */}
					{summary && (
						<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
							<div className="cyber-card p-3">
								<p className="text-[10px] text-gray-400 uppercase">Total Estimated</p>
								<p className="text-lg font-bold text-yellow-400">{formatCurrencyShort(summary.totalEstimated)}</p>
							</div>
							<div className="cyber-card p-3">
								<p className="text-[10px] text-gray-400 uppercase">Total Actual</p>
								<p className="text-lg font-bold text-red-400">{formatCurrencyShort(summary.totalActual)}</p>
							</div>
							<div className="cyber-card p-3">
								<p className="text-[10px] text-gray-400 uppercase">Total Generations</p>
								<p className="text-lg font-bold text-white">{summary.totalGenerations.toLocaleString()}</p>
							</div>
							<div className="cyber-card p-3">
								<p className="text-[10px] text-gray-400 uppercase">Avg Cost/Gen</p>
								<p className="text-lg font-bold text-cyan-400">{formatCurrency(summary.avgCostPerGeneration)}</p>
							</div>
						</div>
					)}

					{/* Cost by Model */}
					<div className="cyber-card p-4">
						<h2 className="text-sm font-semibold text-white mb-3">Cost Breakdown by Model</h2>
						{byModel.length > 0 ? (
							<div className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="text-left text-[10px] text-gray-400 uppercase">
											<th className="pb-2">Model</th>
											<th className="pb-2 text-right">Generations</th>
											<th className="pb-2 text-right">Estimated</th>
											<th className="pb-2 text-right">Actual</th>
											<th className="pb-2 text-right">Avg Cost</th>
											<th className="pb-2 text-right">% of Total</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-cyan-500/10">
										{byModel.map((model) => {
											const percent = totalCost > 0 ? (model.actualCost / totalCost) * 100 : 0;
											const variance = model.estimatedCost > 0
												? ((model.actualCost - model.estimatedCost) / model.estimatedCost) * 100
												: 0;
											return (
												<tr key={model.model}>
													<td className="py-2 text-white font-medium">{model.model}</td>
													<td className="py-2 text-right text-gray-400">{model.generations.toLocaleString()}</td>
													<td className="py-2 text-right text-yellow-400">{formatCurrencyShort(model.estimatedCost)}</td>
													<td className="py-2 text-right">
														<span className="text-red-400">{formatCurrencyShort(model.actualCost)}</span>
														{variance !== 0 && (
															<span className={`ml-1 text-[10px] ${variance > 0 ? "text-red-400" : "text-green-400"}`}>
																({variance > 0 ? "+" : ""}{variance.toFixed(1)}%)
															</span>
														)}
													</td>
													<td className="py-2 text-right text-cyan-400">{formatCurrency(model.avgCost)}</td>
													<td className="py-2 text-right">
														<div className="flex items-center justify-end gap-2">
															<div className="w-16 h-2 bg-gray-800 rounded-full overflow-hidden">
																<div
																	className="h-full bg-red-500 rounded-full"
																	style={{ width: `${percent}%` }}
																/>
															</div>
															<span className="text-gray-400 w-10 text-right">{percent.toFixed(1)}%</span>
														</div>
													</td>
												</tr>
											);
										})}
									</tbody>
									<tfoot>
										<tr className="border-t border-cyan-500/30">
											<td className="pt-2 text-gray-400 font-medium">Total</td>
											<td className="pt-2 text-right text-white font-bold">
												{byModel.reduce((s, m) => s + m.generations, 0).toLocaleString()}
											</td>
											<td className="pt-2 text-right text-yellow-400 font-bold">
												{formatCurrencyShort(byModel.reduce((s, m) => s + m.estimatedCost, 0))}
											</td>
											<td className="pt-2 text-right text-red-400 font-bold">
												{formatCurrencyShort(totalCost)}
											</td>
											<td className="pt-2 text-right text-cyan-400 font-bold">
												{formatCurrency(summary?.avgCostPerGeneration || 0)}
											</td>
											<td className="pt-2 text-right text-gray-400">100%</td>
										</tr>
									</tfoot>
								</table>
							</div>
						) : (
							<p className="text-gray-500 text-sm">No cost data for this period</p>
						)}
					</div>

					{/* Cost Estimation Info */}
					<div className="cyber-card p-4">
						<h2 className="text-sm font-semibold text-white mb-2">About Cost Tracking</h2>
						<div className="text-xs text-gray-400 space-y-1">
							<p><strong className="text-cyan-400">Estimated costs</strong> are calculated at generation time based on model and expected compute time.</p>
							<p><strong className="text-cyan-400">Actual costs</strong> are reconciled from the Replicate billing API and reflect true platform expenses.</p>
							<p>Click "Reconcile Costs" to fetch the latest actual costs from Replicate for unreconciled generations.</p>
						</div>
					</div>
				</>
			)}
		</div>
	);
}
