import { useState } from "react";
import { MODELS_CONFIG, MODEL_CATEGORIES, type ModelConfig } from "../config/models";
import { Modal } from "./Modal";

interface ModelsReferenceModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSelectModel?: (modelId: string) => void;
	currentModel?: string;
}

type CategoryFilter = ModelConfig["category"] | "all";

export function ModelsReferenceModal({
	isOpen,
	onClose,
	onSelectModel,
	currentModel,
}: ModelsReferenceModalProps) {
	const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
	const [expandedModel, setExpandedModel] = useState<string | null>(null);

	const filteredModels =
		categoryFilter === "all"
			? MODELS_CONFIG
			: MODELS_CONFIG.filter((m) => m.category === categoryFilter);

	const categories: CategoryFilter[] = ["all", "fast", "quality", "ultra", "variation", "edit", "external"];

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Model Reference Guide" size="xl">
			<div className="space-y-4">
				{/* Category Filters */}
				<div className="flex flex-wrap gap-2">
					{categories.map((cat) => {
						const info = cat === "all" ? null : MODEL_CATEGORIES[cat];
						return (
							<button
								key={cat}
								type="button"
								onClick={() => setCategoryFilter(cat)}
								className={`px-3 py-1.5 text-xs rounded-full transition-all ${
									categoryFilter === cat
										? "bg-[var(--accent)] text-[var(--bg-primary)]"
										: "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
								}`}
								style={
									categoryFilter === cat && info
										? { backgroundColor: info.color }
										: undefined
								}
							>
								{cat === "all" ? "All Models" : info?.label}
							</button>
						);
					})}
				</div>

				{/* Models Table */}
				<div className="overflow-x-auto">
					<table className="w-full text-xs">
						<thead>
							<tr className="border-b border-[var(--border)]">
								<th className="text-left py-2 px-2 text-[var(--text-secondary)] font-medium">Model</th>
								<th className="text-center py-2 px-2 text-[var(--text-secondary)] font-medium">Category</th>
								<th className="text-center py-2 px-2 text-[var(--text-secondary)] font-medium">Images</th>
								<th className="text-center py-2 px-2 text-[var(--text-secondary)] font-medium">Multi-Out</th>
								<th className="text-center py-2 px-2 text-[var(--text-secondary)] font-medium">Cost</th>
								<th className="text-left py-2 px-2 text-[var(--text-secondary)] font-medium">Best For</th>
							</tr>
						</thead>
						<tbody>
							{filteredModels.map((model) => {
								const catInfo = MODEL_CATEGORIES[model.category];
								const isExpanded = expandedModel === model.id;
								const isCurrent = currentModel === model.id;

								return (
									<>
										<tr
											key={model.id}
											className={`border-b border-[var(--border)]/50 hover:bg-[var(--bg-tertiary)]/50 cursor-pointer transition-colors ${
												isCurrent ? "bg-[var(--accent)]/10" : ""
											}`}
											onClick={() => setExpandedModel(isExpanded ? null : model.id)}
										>
											<td className="py-2 px-2">
												<div className="flex items-center gap-2">
													{onSelectModel && (
														<button
															type="button"
															onClick={(e) => {
																e.stopPropagation();
																onSelectModel(model.id);
																onClose();
															}}
															className="w-5 h-5 rounded border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent)]/10 flex items-center justify-center transition-colors"
															title="Select this model"
														>
															{isCurrent ? (
																<span className="text-[var(--accent)]">✓</span>
															) : (
																<span className="text-[var(--text-secondary)]">+</span>
															)}
														</button>
													)}
													<div>
														<span className="font-medium text-[var(--text-primary)]">
															{model.shortName}
														</span>
														{model.capabilities.requiresImageInput && (
															<span className="ml-1 text-[10px] text-[var(--accent)]">*</span>
														)}
													</div>
												</div>
											</td>
											<td className="py-2 px-2 text-center">
												<span
													className="px-1.5 py-0.5 rounded-full text-[10px] font-medium"
													style={{
														backgroundColor: `${catInfo.color}20`,
														color: catInfo.color,
													}}
												>
													{catInfo.label}
												</span>
											</td>
											<td className="py-2 px-2 text-center text-[var(--text-secondary)]">
												{model.capabilities.supportsImageInput ? (
													<span>
														{model.capabilities.requiresImageInput ? "1 req" : `0-${model.capabilities.maxImages}`}
													</span>
												) : (
													<span className="text-[var(--text-secondary)]/50">—</span>
												)}
											</td>
											<td className="py-2 px-2 text-center">
												{model.capabilities.supportsNumOutputs ? (
													<span className="text-green-500">1-4</span>
												) : (
													<span className="text-[var(--text-secondary)]/50">—</span>
												)}
											</td>
											<td className="py-2 px-2 text-center font-mono text-[var(--accent)]">
												{model.pricing.displayCost}
											</td>
											<td className="py-2 px-2">
												<div className="flex flex-wrap gap-1">
													{model.bestFor.slice(0, 2).map((use) => (
														<span
															key={use}
															className="text-[10px] px-1 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
														>
															{use}
														</span>
													))}
													{model.bestFor.length > 2 && (
														<span className="text-[10px] text-[var(--text-secondary)]">
															+{model.bestFor.length - 2}
														</span>
													)}
												</div>
											</td>
										</tr>
										{isExpanded && (
											<tr key={`${model.id}-details`} className="bg-[var(--bg-tertiary)]/30">
												<td colSpan={6} className="py-3 px-4">
													<div className="space-y-2">
														<p className="text-[var(--text-primary)] text-sm leading-relaxed">
															{model.detailedDescription}
														</p>
														{model.differentiators && (
															<p className="text-xs text-[var(--accent)] italic">
																{model.differentiators}
															</p>
														)}
														{model.similarTo && model.similarTo.length > 0 && (
															<p className="text-xs text-[var(--text-secondary)]">
																<span className="font-medium">Similar to:</span>{" "}
																{model.similarTo.join(", ")}
															</p>
														)}
													</div>
												</td>
											</tr>
										)}
									</>
								);
							})}
						</tbody>
					</table>
				</div>

				{/* Legend */}
				<div className="pt-3 border-t border-[var(--border)] flex flex-wrap gap-4 text-[10px] text-[var(--text-secondary)]">
					<span>
						<span className="text-[var(--accent)]">*</span> Requires image upload
					</span>
					<span>
						<span className="font-medium">Images:</span> Max reference images
					</span>
					<span>
						<span className="font-medium">Multi-Out:</span> Generate multiple images per call
					</span>
				</div>

				{/* Category Descriptions */}
				<div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-2">
					{Object.entries(MODEL_CATEGORIES).map(([key, info]) => (
						<div
							key={key}
							className="p-2 rounded bg-[var(--bg-tertiary)]/50 border-l-2"
							style={{ borderColor: info.color }}
						>
							<span className="text-xs font-medium" style={{ color: info.color }}>
								{info.label}
							</span>
							<p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
								{info.description}
							</p>
						</div>
					))}
				</div>
			</div>
		</Modal>
	);
}

/**
 * Button to open the models reference modal
 */
interface ModelsHelpButtonProps {
	onClick: () => void;
	className?: string;
}

export function ModelsHelpButton({ onClick, className = "" }: ModelsHelpButtonProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`text-xs text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors flex items-center gap-1 ${className}`}
			title="View model reference guide"
		>
			<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
			<span>Model Guide</span>
		</button>
	);
}
