import { API_BASE } from "../config";
import type { Generation, GenerationImage, QueuedGeneration } from "../types";
import { GenerationProgressBar } from "./GenerationProgressBar";
import { IconDownload, IconRemix, IconTrash, IconUpscale, IconVariations } from "./Icons";

interface ChatMessageProps {
	generation: Generation | QueuedGeneration;
	onVariations?: (gen: Generation) => void;
	onUpscale?: (gen: Generation) => void;
	onRemix?: (gen: Generation) => void;
	onTrash?: (id: string) => void;
	onImageClick?: (gen: Generation) => void;
}

// 4-up grid component for variation results
function ImageGrid({
	images,
	prompt,
	onImageClick,
}: {
	images: GenerationImage[];
	prompt: string;
	onImageClick?: (url: string) => void;
}) {
	return (
		<div className="grid grid-cols-2 gap-2 max-w-md">
			{images.map((img, index) => (
				<button
					key={img.id}
					type="button"
					onClick={() => onImageClick?.(img.url)}
					className="block rounded-lg overflow-hidden cyber-card hover:neon-border transition-all cursor-pointer aspect-square"
				>
					<img
						src={`${API_BASE}${img.url}`}
						alt={`${prompt} - variation ${index + 1}`}
						className="w-full h-full object-cover"
						loading="lazy"
					/>
				</button>
			))}
		</div>
	);
}

function isQueuedGeneration(gen: Generation | QueuedGeneration): gen is QueuedGeneration {
	return "status" in gen;
}

function formatTime(dateString: string): string {
	const date = new Date(dateString);
	return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function ChatMessage({
	generation,
	onVariations,
	onUpscale,
	onRemix,
	onTrash,
	onImageClick,
}: ChatMessageProps) {
	const isQueued = isQueuedGeneration(generation);
	const isGenerating = isQueued && generation.status === "generating";
	const isFailed = isQueued && generation.status === "failed";
	const isComplete = !isQueued || generation.status === "completed";

	const imageUrl = isQueued ? generation.result?.imageUrl : generation.imageUrl;

	// Check for multi-image variations (4-up grid)
	const images = !isQueued ? (generation as Generation).images : undefined;
	const hasMultipleImages = images && images.length > 1;

	return (
		<div className="py-4">
			{/* Timestamp */}
			<div className="text-[10px] text-[var(--text-secondary)] mb-2 mono">
				{formatTime(generation.createdAt)}
			</div>

			{/* Prompt bubble */}
			<div className="cyber-card rounded-lg p-3 mb-3 max-w-lg border-l-2 border-l-[var(--accent)]">
				<p className="text-sm text-[var(--text-primary)]">{generation.prompt}</p>
			</div>

			{/* Image or status */}
			{isGenerating ? (
				<div className="cyber-card rounded-lg p-4 max-w-md aspect-square flex items-center justify-center">
					<div className="flex flex-col items-center w-full px-4">
						{generation.startedAt ? (
							<>
								<div className="w-8 h-8 mb-3 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
								<span className="text-xs text-[var(--accent)] mb-3 mono">generating</span>
								<GenerationProgressBar
									startedAt={generation.startedAt}
									estimatedDuration={generation.estimatedDuration || 30}
									status={generation.status}
								/>
							</>
						) : (
							<div className="text-sm text-[var(--text-secondary)] mono">
								Queued<span className="cursor-blink">_</span>
							</div>
						)}
					</div>
				</div>
			) : isFailed ? (
				<div className="cyber-card rounded-lg p-4 max-w-md border-l-2 border-l-[var(--accent-alt)]">
					<span className="text-sm text-[var(--accent-alt)]">
						Generation failed: {generation.error || "Unknown error"}
					</span>
				</div>
			) : hasMultipleImages ? (
				// 4-up grid for variations
				<div className="max-w-md">
					<ImageGrid
						images={images}
						prompt={generation.prompt}
						onImageClick={(url) => {
							// Create a synthetic generation for the clicked image
							if (onImageClick && !isQueued) {
								const gen = generation as Generation;
								onImageClick({ ...gen, imageUrl: url });
							}
						}}
					/>

					{/* Action buttons for grid */}
					{isComplete && !isQueued && (
						<div className="flex items-center gap-1 mt-3">
							{onVariations && (
								<button
									type="button"
									onClick={() => onVariations(generation as Generation)}
									className="flex items-center gap-1.5 px-3 py-1.5 text-xs cyber-card hover:neon-border rounded-lg transition-all"
									title="Generate more variations"
								>
									<IconVariations className="w-4 h-4" />
									<span className="hidden sm:inline">Vary Again</span>
								</button>
							)}
							{onTrash && (
								<button
									type="button"
									onClick={() => onTrash(generation.id)}
									className="flex items-center gap-1.5 px-3 py-1.5 text-xs cyber-card hover:bg-[var(--accent-alt)]/20 rounded-lg transition-all ml-auto"
									title="Move to trash"
								>
									<IconTrash className="w-4 h-4" />
								</button>
							)}
						</div>
					)}
				</div>
			) : imageUrl ? (
				// Single image display
				<div className="max-w-md">
					<button
						type="button"
						onClick={() => onImageClick && !isQueued && onImageClick(generation as Generation)}
						className="block w-full rounded-lg overflow-hidden cyber-card hover:neon-border transition-all cursor-pointer"
					>
						<img
							src={`${API_BASE}${imageUrl}`}
							alt={generation.prompt}
							className="w-full h-auto"
							loading="lazy"
						/>
					</button>

					{/* Action buttons for single image */}
					{isComplete && !isQueued && (
						<div className="flex items-center gap-1 mt-3">
							{onVariations && (
								<button
									type="button"
									onClick={() => onVariations(generation as Generation)}
									className="flex items-center gap-1.5 px-3 py-1.5 text-xs cyber-card hover:neon-border rounded-lg transition-all"
									title="Generate variations"
								>
									<IconVariations className="w-4 h-4" />
									<span className="hidden sm:inline">Vary</span>
								</button>
							)}
							{onUpscale && (
								<button
									type="button"
									onClick={() => onUpscale(generation as Generation)}
									className="flex items-center gap-1.5 px-3 py-1.5 text-xs cyber-card hover:neon-border rounded-lg transition-all"
									title="Upscale to higher resolution"
								>
									<IconUpscale className="w-4 h-4" />
									<span className="hidden sm:inline">Upscale</span>
								</button>
							)}
							{onRemix && (
								<button
									type="button"
									onClick={() => onRemix(generation as Generation)}
									className="flex items-center gap-1.5 px-3 py-1.5 text-xs cyber-card hover:neon-border rounded-lg transition-all"
									title="Use as input for new generation"
								>
									<IconRemix className="w-4 h-4" />
									<span className="hidden sm:inline">Remix</span>
								</button>
							)}
							<a
								href={`${API_BASE}${imageUrl}`}
								download
								className="flex items-center gap-1.5 px-3 py-1.5 text-xs cyber-card hover:neon-border rounded-lg transition-all"
								title="Download image"
							>
								<IconDownload className="w-4 h-4" />
							</a>
							{onTrash && (
								<button
									type="button"
									onClick={() => onTrash(generation.id)}
									className="flex items-center gap-1.5 px-3 py-1.5 text-xs cyber-card hover:bg-[var(--accent-alt)]/20 rounded-lg transition-all ml-auto"
									title="Move to trash"
								>
									<IconTrash className="w-4 h-4" />
								</button>
							)}
						</div>
					)}
				</div>
			) : null}
		</div>
	);
}
