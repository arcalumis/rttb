import { useEffect, useRef } from "react";
import type { Generation, QueuedGeneration } from "../types";
import { ChatMessage } from "./ChatMessage";

interface ChatFeedProps {
	generations: Generation[];
	queuedItems: QueuedGeneration[];
	onVariations: (gen: Generation) => void;
	onUpscale: (gen: Generation) => void;
	onRemix: (gen: Generation) => void;
	onTrash: (id: string) => void;
	onImageClick: (gen: Generation) => void;
	onLoadMore: () => void;
	hasMore: boolean;
	loading: boolean;
}

export function ChatFeed({
	generations,
	queuedItems,
	onVariations,
	onUpscale,
	onRemix,
	onTrash,
	onImageClick,
	onLoadMore,
	hasMore,
	loading,
}: ChatFeedProps) {
	const feedRef = useRef<HTMLDivElement>(null);
	const prevQueueLengthRef = useRef(queuedItems.length);
	const hasScrolledToBottom = useRef(false);

	// Scroll to bottom on initial load when there's content
	useEffect(() => {
		if (!hasScrolledToBottom.current && generations.length > 0 && feedRef.current) {
			feedRef.current.scrollTop = feedRef.current.scrollHeight;
			hasScrolledToBottom.current = true;
		}
	}, [generations.length]);

	// Auto-scroll to bottom when new items are added
	useEffect(() => {
		// Only scroll if queue length increased (new generation started)
		if (queuedItems.length > prevQueueLengthRef.current) {
			feedRef.current?.scrollTo({
				top: feedRef.current.scrollHeight,
				behavior: "smooth",
			});
		}
		prevQueueLengthRef.current = queuedItems.length;
	}, [queuedItems.length]);

	// Combine and sort: older generations first, then queued items at the end
	// Reverse generations so oldest is first (Discord style: oldest at top, newest at bottom)
	const sortedGenerations = [...generations].reverse();

	const hasContent = generations.length > 0 || queuedItems.length > 0;

	if (!hasContent && !loading) {
		return (
			<div className="flex-1 flex items-center justify-center text-gray-500">
				<div className="text-center">
					<p className="text-sm">No generations yet</p>
					<p className="text-xs mt-1">Type a prompt below to get started</p>
				</div>
			</div>
		);
	}

	return (
		<div
			ref={feedRef}
			className="flex-1 overflow-y-auto px-3 pb-3"
		>
			{/* Load more button at top */}
			{hasMore && (
				<div className="flex justify-center py-4">
					<button
						type="button"
						onClick={onLoadMore}
						disabled={loading}
						className="px-4 py-2 text-xs cyber-card hover:neon-border rounded transition-all disabled:opacity-50"
					>
						{loading ? "Loading..." : "Load older messages"}
					</button>
				</div>
			)}

			{/* Completed generations (oldest first for Discord-style) */}
			{sortedGenerations.map((gen) => (
				<ChatMessage
					key={gen.id}
					generation={gen}
					onVariations={onVariations}
					onUpscale={onUpscale}
					onRemix={onRemix}
					onTrash={onTrash}
					onImageClick={onImageClick}
				/>
			))}

			{/* Queued/generating items at the bottom */}
			{queuedItems.map((item) => (
				<ChatMessage
					key={item.id}
					generation={item}
					onTrash={undefined} // Can't trash queued items
				/>
			))}
		</div>
	);
}
