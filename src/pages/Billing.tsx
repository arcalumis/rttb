import { useCallback, useEffect, useState } from "react";
import { API_BASE } from "../config";
import { useAuth } from "../contexts/AuthContext";

interface BillingInfo {
	subscription: {
		id: string;
		status: string;
		planName: string;
		price: number;
		monthlyImageLimit: number | null;
		monthlyCostLimit: number | null;
		periodStart: string | null;
		periodEnd: string | null;
	} | null;
	usage: {
		imageCount: number;
		totalCost: number;
	};
	totalSpentCents: number;
	recentPayments: Array<{
		id: string;
		amount: number;
		currency: string;
		status: string;
		type: string;
		description: string | null;
		date: string;
	}>;
	hasStripeCustomer: boolean;
}

interface Product {
	id: string;
	name: string;
	description: string | null;
	monthlyImageLimit: number | null;
	monthlyCostLimit: number | null;
	bonusCredits: number;
	price: number;
	stripePriceId: string | null;
	overagePriceCents: number;
}

interface Invoice {
	id: string;
	number: string | null;
	amount: number;
	currency: string;
	status: string | null;
	date: string | null;
	pdfUrl: string | null;
	hostedUrl: string | null;
}

export function Billing() {
	const { token } = useAuth();
	const [billing, setBilling] = useState<BillingInfo | null>(null);
	const [products, setProducts] = useState<Product[]>([]);
	const [invoices, setInvoices] = useState<Invoice[]>([]);
	const [stripeEnabled, setStripeEnabled] = useState(false);
	const [loading, setLoading] = useState(true);
	const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

	const fetchData = useCallback(async () => {
		if (!token) return;

		setLoading(true);
		try {
			const headers = { Authorization: `Bearer ${token}` };

			const [statusRes, billingRes, productsRes, invoicesRes] = await Promise.all([
				fetch(`${API_BASE}/api/billing/status`),
				fetch(`${API_BASE}/api/billing`, { headers }),
				fetch(`${API_BASE}/api/billing/products`),
				fetch(`${API_BASE}/api/billing/invoices`, { headers }).catch(() => null),
			]);

			if (statusRes.ok) {
				const data = await statusRes.json();
				setStripeEnabled(data.enabled);
			}

			if (billingRes.ok) {
				const data = await billingRes.json();
				setBilling(data);
			}

			if (productsRes.ok) {
				const data = await productsRes.json();
				setProducts(data.products || []);
			}

			if (invoicesRes?.ok) {
				const data = await invoicesRes.json();
				setInvoices(data.invoices || []);
			}
		} catch (err) {
			console.error("Failed to fetch billing data:", err);
		} finally {
			setLoading(false);
		}
	}, [token]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const handleCheckout = async (priceId: string, productId: string) => {
		if (!token || !priceId) return;

		setCheckoutLoading(productId);
		try {
			const response = await fetch(`${API_BASE}/api/billing/checkout`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					priceId,
					successUrl: `${window.location.origin}/billing?success=true`,
					cancelUrl: `${window.location.origin}/billing?canceled=true`,
				}),
			});

			if (response.ok) {
				const data = await response.json();
				if (data.url) {
					window.location.href = data.url;
				}
			}
		} catch (err) {
			console.error("Failed to create checkout:", err);
		} finally {
			setCheckoutLoading(null);
		}
	};

	const handleManageBilling = async () => {
		if (!token) return;

		try {
			const response = await fetch(`${API_BASE}/api/billing/portal`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					returnUrl: `${window.location.origin}/billing`,
				}),
			});

			if (response.ok) {
				const data = await response.json();
				if (data.url) {
					window.location.href = data.url;
				}
			}
		} catch (err) {
			console.error("Failed to open billing portal:", err);
		}
	};

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
		}).format(value);
	};

	const formatDate = (dateStr: string | null) => {
		if (!dateStr) return "N/A";
		return new Date(dateStr).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500" />
			</div>
		);
	}

	const usagePercent = billing?.subscription?.monthlyImageLimit
		? Math.min(100, (billing.usage.imageCount / billing.subscription.monthlyImageLimit) * 100)
		: 0;

	return (
		<div className="p-4 max-w-4xl mx-auto space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-xl font-bold text-white">Billing & Subscription</h1>
				<p className="text-xs text-gray-400">Manage your subscription and view usage</p>
			</div>

			{/* Current Subscription */}
			<div className="cyber-card p-4">
				<h2 className="text-sm font-semibold text-white mb-3">Current Plan</h2>
				{billing?.subscription ? (
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-lg font-bold text-cyan-400">{billing.subscription.planName}</p>
								<p className="text-xs text-gray-500">
									{formatCurrency(billing.subscription.price)}/month
								</p>
							</div>
							<span
								className={`px-2 py-1 text-xs rounded ${
									billing.subscription.status === "active"
										? "bg-green-500/20 text-green-400"
										: billing.subscription.status === "past_due"
											? "bg-yellow-500/20 text-yellow-400"
											: "bg-gray-500/20 text-gray-400"
								}`}
							>
								{billing.subscription.status}
							</span>
						</div>

						{billing.subscription.periodStart && billing.subscription.periodEnd && (
							<p className="text-xs text-gray-500">
								Current period: {formatDate(billing.subscription.periodStart)} -{" "}
								{formatDate(billing.subscription.periodEnd)}
							</p>
						)}

						{billing.hasStripeCustomer && stripeEnabled && (
							<button
								type="button"
								onClick={handleManageBilling}
								className="cyber-button text-xs py-2 px-4"
							>
								Manage Subscription
							</button>
						)}
					</div>
				) : (
					<div className="text-center py-4">
						<p className="text-gray-400">No active subscription</p>
						<p className="text-xs text-gray-500 mt-1">Choose a plan below to get started</p>
					</div>
				)}
			</div>

			{/* Usage */}
			<div className="cyber-card p-4">
				<h2 className="text-sm font-semibold text-white mb-3">This Month's Usage</h2>
				<div className="grid grid-cols-2 gap-4">
					<div>
						<p className="text-[10px] text-gray-400 uppercase">Images Generated</p>
						<p className="text-2xl font-bold text-white">{billing?.usage.imageCount || 0}</p>
						{billing?.subscription?.monthlyImageLimit && (
							<>
								<p className="text-xs text-gray-500">
									of {billing.subscription.monthlyImageLimit} included
								</p>
								<div className="mt-2 h-2 bg-gray-800 rounded-full overflow-hidden">
									<div
										className={`h-full rounded-full transition-all ${
											usagePercent >= 90
												? "bg-red-500"
												: usagePercent >= 70
													? "bg-yellow-500"
													: "bg-cyan-500"
										}`}
										style={{ width: `${usagePercent}%` }}
									/>
								</div>
							</>
						)}
					</div>
					<div>
						<p className="text-[10px] text-gray-400 uppercase">Platform Cost</p>
						<p className="text-2xl font-bold text-white">
							{formatCurrency(billing?.usage.totalCost || 0)}
						</p>
						{billing?.subscription?.monthlyCostLimit && (
							<p className="text-xs text-gray-500">
								of {formatCurrency(billing.subscription.monthlyCostLimit)} limit
							</p>
						)}
					</div>
				</div>
			</div>

			{/* Subscription Plans */}
			{stripeEnabled && products.length > 0 && (
				<div className="cyber-card p-4">
					<h2 className="text-sm font-semibold text-white mb-3">Available Plans</h2>
					<div className="grid md:grid-cols-3 gap-4">
						{products.map((product) => {
							const isCurrentPlan = billing?.subscription?.planName === product.name;
							return (
								<div
									key={product.id}
									className={`p-4 rounded-lg border transition-all ${
										isCurrentPlan
											? "border-cyan-500 bg-cyan-500/10"
											: "border-gray-700 hover:border-cyan-500/50"
									}`}
								>
									<h3 className="text-lg font-bold text-white">{product.name}</h3>
									<p className="text-2xl font-bold text-cyan-400 mt-1">
										{product.price === 0 ? "Free" : formatCurrency(product.price)}
										{product.price > 0 && <span className="text-xs text-gray-400">/mo</span>}
									</p>
									{product.description && (
										<p className="text-xs text-gray-400 mt-2">{product.description}</p>
									)}
									<ul className="mt-3 space-y-1 text-xs text-gray-400">
										{product.monthlyImageLimit && (
											<li>{product.monthlyImageLimit} images/month</li>
										)}
										{product.monthlyCostLimit && (
											<li>{formatCurrency(product.monthlyCostLimit)} platform cost limit</li>
										)}
										{product.bonusCredits > 0 && <li>{product.bonusCredits} bonus credits</li>}
										{product.overagePriceCents > 0 && (
											<li>
												{formatCurrency(product.overagePriceCents / 100)} per overage generation
											</li>
										)}
									</ul>
									{isCurrentPlan ? (
										<div className="mt-4 py-2 text-center text-xs text-cyan-400">
											Current Plan
										</div>
									) : product.stripePriceId ? (
										<button
											type="button"
											onClick={() => handleCheckout(product.stripePriceId!, product.id)}
											disabled={!!checkoutLoading}
											className="mt-4 w-full cyber-button text-xs py-2"
										>
											{checkoutLoading === product.id ? "Loading..." : "Subscribe"}
										</button>
									) : (
										<div className="mt-4 py-2 text-center text-xs text-gray-500">
											Contact support
										</div>
									)}
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* Payment History */}
			{billing?.recentPayments && billing.recentPayments.length > 0 && (
				<div className="cyber-card p-4">
					<h2 className="text-sm font-semibold text-white mb-3">Recent Payments</h2>
					<div className="space-y-2">
						{billing.recentPayments.map((payment) => (
							<div
								key={payment.id}
								className="flex items-center justify-between p-2 bg-black/30 rounded text-sm"
							>
								<div>
									<p className="text-white">{payment.description || payment.type}</p>
									<p className="text-[10px] text-gray-500">{formatDate(payment.date)}</p>
								</div>
								<span className="text-green-400 font-medium">
									{formatCurrency(payment.amount)}
								</span>
							</div>
						))}
					</div>
					<div className="mt-3 pt-3 border-t border-cyan-500/20 flex justify-between text-sm">
						<span className="text-gray-400">Total Spent (All Time)</span>
						<span className="text-white font-bold">
							{formatCurrency((billing.totalSpentCents || 0) / 100)}
						</span>
					</div>
				</div>
			)}

			{/* Invoices */}
			{invoices.length > 0 && (
				<div className="cyber-card p-4">
					<h2 className="text-sm font-semibold text-white mb-3">Invoices</h2>
					<div className="space-y-2">
						{invoices.map((invoice) => (
							<div
								key={invoice.id}
								className="flex items-center justify-between p-2 bg-black/30 rounded text-sm"
							>
								<div>
									<p className="text-white">{invoice.number || invoice.id}</p>
									<p className="text-[10px] text-gray-500">{formatDate(invoice.date)}</p>
								</div>
								<div className="flex items-center gap-3">
									<span className="text-cyan-400">{formatCurrency(invoice.amount)}</span>
									{invoice.pdfUrl && (
										<a
											href={invoice.pdfUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="text-xs text-gray-400 hover:text-cyan-400"
										>
											PDF
										</a>
									)}
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Billing not enabled notice */}
			{!stripeEnabled && (
				<div className="cyber-card p-4 text-center">
					<p className="text-gray-400">Billing is not yet configured for this instance.</p>
					<p className="text-xs text-gray-500 mt-1">Contact the administrator for more information.</p>
				</div>
			)}
		</div>
	);
}
