import { API_BASE } from "../config";

interface SelectedInputsPreviewProps {
	imageUrls: string[];
	onRemove: (url: string) => void;
	maxImages: number;
}

export function SelectedInputsPreview({
	imageUrls,
	onRemove,
	maxImages,
}: SelectedInputsPreviewProps) {
	if (imageUrls.length === 0) {
		return (
			<div className="text-center py-2 text-gray-500">
				<p className="text-[10px]">Click + on gallery images to add inputs</p>
			</div>
		);
	}

	return (
		<div className="space-y-1.5">
			<div className="flex items-center justify-between">
				<span className="text-xs text-gray-400">Selected Inputs</span>
				<span className="text-[10px] text-cyan-400">{imageUrls.length}/{maxImages}</span>
			</div>
			<div className="grid grid-cols-4 gap-1">
				{imageUrls.map((url) => (
					<div key={url} className="relative aspect-square group">
						<img
							src={url.startsWith("http") ? url : `${API_BASE}${url}`}
							alt="Input"
							className="w-full h-full object-cover rounded"
						/>
						<button
							type="button"
							onClick={() => onRemove(url)}
							className="absolute top-0.5 right-0.5 p-0.5 bg-red-600/90 rounded opacity-0 group-hover:opacity-100 transition-opacity"
							title="Remove"
						>
							<svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				))}
			</div>
		</div>
	);
}
