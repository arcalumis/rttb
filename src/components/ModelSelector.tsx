import type { Model } from "../types";

interface ModelSelectorProps {
	models: Model[];
	selectedModel: string;
	onSelectModel: (modelId: string) => void;
	disabled?: boolean;
}

export function ModelSelector({
	models,
	selectedModel,
	onSelectModel,
	disabled,
}: ModelSelectorProps) {
	return (
		<div className="w-full">
			<select
				id="model-select"
				value={selectedModel}
				onChange={(e) => onSelectModel(e.target.value)}
				disabled={disabled}
				className="cyber-input w-full px-3 py-2 rounded text-white text-sm disabled:opacity-50"
			>
				{models.map((model) => (
					<option key={model.id} value={model.id}>
						{model.name}
					</option>
				))}
			</select>
		</div>
	);
}
