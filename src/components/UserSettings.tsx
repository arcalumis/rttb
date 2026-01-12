import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
	useUserApiKey,
	useUserCredits,
	useUserSubscription,
	useUserUsage,
} from "../hooks/useUserSettings";

interface UserSettingsProps {
	isOpen: boolean;
	onClose: () => void;
}

export function UserSettings({ isOpen, onClose }: UserSettingsProps) {
	const { token } = useAuth();
	const { subscription, fetchSubscription } = useUserSubscription(token);
	const { usage, fetchUsage } = useUserUsage(token);
	const { credits, fetchCredits } = useUserCredits(token);
	const {
		apiKeyInfo,
		loading: apiKeyLoading,
		error: apiKeyError,
		fetchApiKey,
		saveApiKey,
		deleteApiKey,
	} = useUserApiKey(token);

	const [newApiKey, setNewApiKey] = useState("");
	const [showApiKeyInput, setShowApiKeyInput] = useState(false);

	useEffect(() => {
		if (isOpen) {
			fetchSubscription();
			fetchUsage();
			fetchCredits();
			fetchApiKey();
		}
	}, [isOpen, fetchSubscription, fetchUsage, fetchCredits, fetchApiKey]);

	const handleSaveApiKey = async () => {
		if (!newApiKey) return;
		const success = await saveApiKey(newApiKey);
		if (success) {
			setNewApiKey("");
			setShowApiKeyInput(false);
		}
	};

	const handleDeleteApiKey = async () => {
		if (!confirm("Are you sure you want to remove your API key?")) return;
		await deleteApiKey();
	};

	if (!isOpen) return null;

	const usagePercent = usage?.limits?.monthlyImageLimit
		? Math.min(100, (usage.usage.imageCount / usage.limits.monthlyImageLimit) * 100)
		: 0;

	return (
		<div
			className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
			onClick={onClose}
			onKeyDown={(e) => e.key === "Escape" && onClose()}
		>
			<div
				className="bg-gray-900 rounded-lg w-full max-w-lg max-h-[80vh] overflow-auto"
				onClick={(e) => e.stopPropagation()}
				onKeyDown={() => {}}
			>
				<div className="flex items-center justify-between p-4 border-b border-gray-700 sticky top-0 bg-gray-900">
					<h2 className="text-xl font-semibold">Account Settings</h2>
					<button type="button" onClick={onClose} className="p-1 hover:bg-gray-700 rounded">
						<svg
							className="w-6 h-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							role="img"
							aria-label="Close"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>

				<div className="p-4 space-y-6">
					{/* Subscription */}
					<section>
						<h3 className="text-sm font-medium text-gray-400 mb-3">Subscription</h3>
						<div className="bg-gray-800 rounded-lg p-4">
							{subscription?.subscription ? (
								<>
									<div className="flex items-center justify-between mb-2">
										<span className="text-lg font-semibold">{subscription.subscription.name}</span>
										{subscription.subscription.price > 0 ? (
											<span className="text-purple-400">${subscription.subscription.price}/mo</span>
										) : (
											<span className="text-green-400">Free</span>
										)}
									</div>
									{subscription.subscription.description && (
										<p className="text-sm text-gray-400">{subscription.subscription.description}</p>
									)}
								</>
							) : (
								<p className="text-gray-400">No active subscription</p>
							)}
						</div>
					</section>

					{/* Usage */}
					<section>
						<h3 className="text-sm font-medium text-gray-400 mb-3">This Month&apos;s Usage</h3>
						<div className="bg-gray-800 rounded-lg p-4">
							<div className="flex justify-between text-sm mb-2">
								<span>Images Generated</span>
								<span>
									{usage?.usage.imageCount || 0}
									{usage?.limits?.monthlyImageLimit ? ` / ${usage.limits.monthlyImageLimit}` : ""}
								</span>
							</div>

							{usage?.limits?.monthlyImageLimit && (
								<div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-3">
									<div
										className={`h-full transition-all ${usagePercent >= 90 ? "bg-red-500" : usagePercent >= 70 ? "bg-yellow-500" : "bg-purple-500"}`}
										style={{ width: `${usagePercent}%` }}
									/>
								</div>
							)}

							<div className="flex justify-between text-sm text-gray-400">
								<span>Total Cost</span>
								<span>${(usage?.usage.totalCost || 0).toFixed(4)}</span>
							</div>

							{usage?.usage.usedOwnKey !== undefined && usage.usage.usedOwnKey > 0 && (
								<div className="flex justify-between text-sm text-gray-400 mt-1">
									<span>Using Your API Key</span>
									<span>{usage.usage.usedOwnKey} generations</span>
								</div>
							)}

							{usage && !usage.canGenerate && (
								<div className="mt-3 p-2 bg-red-900/30 border border-red-800 rounded text-sm text-red-300">
									{usage.limitReason}
								</div>
							)}
						</div>
					</section>

					{/* Credits */}
					<section>
						<h3 className="text-sm font-medium text-gray-400 mb-3">Bonus Credits</h3>
						<div className="bg-gray-800 rounded-lg p-4">
							<div className="flex items-center justify-between">
								<span className="text-2xl font-bold">{credits?.credits || 0}</span>
								<span className="text-sm text-gray-400">credits available</span>
							</div>
							{credits?.history && credits.history.length > 0 && (
								<div className="mt-3 pt-3 border-t border-gray-700">
									<p className="text-xs text-gray-500 mb-2">Recent history</p>
									<div className="space-y-1">
										{credits.history.slice(0, 3).map((h) => (
											<div key={h.id} className="flex justify-between text-xs">
												<span className="text-gray-400">{h.reason || h.type}</span>
												<span className={h.amount > 0 ? "text-green-400" : "text-red-400"}>
													{h.amount > 0 ? "+" : ""}
													{h.amount}
												</span>
											</div>
										))}
									</div>
								</div>
							)}
						</div>
					</section>

					{/* API Key */}
					<section>
						<h3 className="text-sm font-medium text-gray-400 mb-3">Replicate API Key (BYO)</h3>
						<div className="bg-gray-800 rounded-lg p-4">
							{apiKeyInfo?.hasKey ? (
								<>
									<div className="flex items-center justify-between mb-3">
										<div>
											<p className="text-sm">Your API key is configured</p>
											<p className="text-xs text-gray-400 font-mono">{apiKeyInfo.maskedKey}</p>
										</div>
										<span className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs">
											Active
										</span>
									</div>
									<div className="flex gap-2">
										<button
											type="button"
											onClick={() => setShowApiKeyInput(true)}
											className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
										>
											Update Key
										</button>
										<button
											type="button"
											onClick={handleDeleteApiKey}
											className="px-3 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded text-sm transition-colors"
										>
											Remove
										</button>
									</div>
								</>
							) : (
								<>
									<p className="text-sm text-gray-400 mb-3">
										Add your own Replicate API key to use your own credits instead of the
										platform&apos;s.
									</p>
									{!showApiKeyInput ? (
										<button
											type="button"
											onClick={() => setShowApiKeyInput(true)}
											className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm transition-colors"
										>
											Add API Key
										</button>
									) : null}
								</>
							)}

							{showApiKeyInput && (
								<div className="mt-3 space-y-2">
									<input
										type="password"
										value={newApiKey}
										onChange={(e) => setNewApiKey(e.target.value)}
										placeholder="r8_..."
										className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-purple-500"
									/>
									{apiKeyError && <p className="text-sm text-red-400">{apiKeyError}</p>}
									<div className="flex gap-2">
										<button
											type="button"
											onClick={() => {
												setShowApiKeyInput(false);
												setNewApiKey("");
											}}
											className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
										>
											Cancel
										</button>
										<button
											type="button"
											onClick={handleSaveApiKey}
											disabled={!newApiKey || apiKeyLoading}
											className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded text-sm transition-colors"
										>
											{apiKeyLoading ? "Validating..." : "Save Key"}
										</button>
									</div>
								</div>
							)}

							<p className="text-xs text-gray-500 mt-3">
								Get your API key from replicate.com/account/api-tokens
							</p>
						</div>
					</section>
				</div>
			</div>
		</div>
	);
}
