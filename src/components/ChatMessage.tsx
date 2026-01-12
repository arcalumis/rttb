import { API_BASE } from "../config";
import type { Generation, QueuedGeneration } from "../types";
import { GenerationProgressBar } from "./GenerationProgressBar";
import {
	IconDownload,
	IconRemix,
	IconTrash,
	IconUpscale,
	IconVariations,
} from "./Icons";

interface ChatMessageProps {
	generation: Generation | QueuedGeneration;
	onVariations?: (gen: Generation) => void;
	onUpscale?: (gen: Generation) => void;
	onRemix?: (gen: Generation) => void;
	onTrash?: (id: string) => void;
	onImageClick?: (gen: Generation) => void;
}

function isQueuedGeneration(
	gen: Generation | QueuedGeneration,
): gen is QueuedGeneration {
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

	const imageUrl = isQueued
		? generation.result?.imageUrl
		: generation.imageUrl;

	return (
		<div className="py-3">
			{/* Timestamp */}
			<div className="text-[10px] text-gray-500 mb-1">
				{formatTime(generation.createdAt)}
			</div>

			{/* Prompt bubble */}
			<div className="cyber-card neon-border rounded-lg p-3 mb-3 max-w-lg">
				<p className="text-sm text-white">{generation.prompt}</p>
			</div>

			{/* Image or status */}
			{isGenerating ? (
				<div className="cyber-card rounded-lg p-6 max-w-md flex flex-col items-center justify-center">
					<div className="w-8 h-8 mb-3 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
					<span className="text-sm text-cyan-400 mb-3">Generating...</span>
					{generation.startedAt && (
						<div className="w-full max-w-48">
							<GenerationProgressBar
								startedAt={generation.startedAt}
								estimatedDuration={generation.estimatedDuration || 30}
								status={generation.status}
							/>
						</div>
					)}
				</div>
			) : isFailed ? (
				<div className="cyber-card rounded-lg p-4 max-w-md border border-red-500/50">
					<span className="text-sm text-red-400">
						Generation failed: {generation.error || "Unknown error"}
					</span>
				</div>
			) : imageUrl ? (
				<div className="max-w-md">
					{/* Image */}
					<button
						type="button"
						onClick={() =>
							onImageClick && !isQueued && onImageClick(generation as Generation)
						}
						className="block w-full rounded-lg overflow-hidden cyber-card hover:neon-border transition-all cursor-pointer"
					>
						<img
							src={`${API_BASE}${imageUrl}`}
							alt={generation.prompt}
							className="w-full h-auto"
							loading="lazy"
						/>
					</button>

					{/* Action buttons */}
					{isComplete && !isQueued && (
						<div className="flex items-center gap-1 mt-2">
							{onVariations && (
								<button
									type="button"
									onClick={() => onVariations(generation as Generation)}
									className="flex items-center gap-1 px-2 py-1 text-xs cyber-card hover:neon-border rounded transition-all"
									title="Generate variations"
								>
									<IconVariations className="w-3.5 h-3.5" />
									<span className="hidden sm:inline">Vary</span>
								</button>
							)}
							{onUpscale && (
								<button
									type="button"
									onClick={() => onUpscale(generation as Generation)}
									className="flex items-center gap-1 px-2 py-1 text-xs cyber-card hover:neon-border rounded transition-all"
									title="Upscale to higher resolution"
								>
									<IconUpscale className="w-3.5 h-3.5" />
									<span className="hidden sm:inline">Upscale</span>
								</button>
							)}
							{onRemix && (
								<button
									type="button"
									onClick={() => onRemix(generation as Generation)}
									className="flex items-center gap-1 px-2 py-1 text-xs cyber-card hover:neon-border rounded transition-all"
									title="Use as input for new generation"
								>
									<IconRemix className="w-3.5 h-3.5" />
									<span className="hidden sm:inline">Remix</span>
								</button>
							)}
							<a
								href={`${API_BASE}${imageUrl}`}
								download
								className="flex items-center gap-1 px-2 py-1 text-xs cyber-card hover:neon-border rounded transition-all"
								title="Download image"
							>
								<IconDownload className="w-3.5 h-3.5" />
							</a>
							{onTrash && (
								<button
									type="button"
									onClick={() => onTrash(generation.id)}
									className="flex items-center gap-1 px-2 py-1 text-xs cyber-card hover:bg-red-500/20 hover:text-red-400 rounded transition-all ml-auto"
									title="Move to trash"
								>
									<IconTrash className="w-3.5 h-3.5" />
								</button>
							)}
						</div>
					)}
				</div>
			) : null}
		</div>
	);
}
