import { useEffect, useState } from "react";

interface RetroProgressBarProps {
	startedAt: string;
	estimatedDuration: number; // seconds
	status: "queued" | "generating" | "completed" | "failed";
}

const TOTAL_SEGMENTS = 20;

export function RetroProgressBar({ startedAt, estimatedDuration, status }: RetroProgressBarProps) {
	const [progress, setProgress] = useState(0);

	useEffect(() => {
		if (status !== "generating") return;

		const startTime = new Date(startedAt).getTime();
		const estimatedMs = estimatedDuration * 1000;

		const updateProgress = () => {
			const elapsed = Date.now() - startTime;
			// Asymptotic progress - never quite reaches 100% until complete
			const rawProgress = 1 - Math.exp(-elapsed / (estimatedMs * 0.7));
			// Cap at 95% during generation
			setProgress(Math.min(rawProgress * 100, 95));
		};

		updateProgress();
		const interval = setInterval(updateProgress, 100);
		return () => clearInterval(interval);
	}, [startedAt, estimatedDuration, status]);

	// Jump to 100% when completed
	useEffect(() => {
		if (status === "completed") {
			setProgress(100);
		}
	}, [status]);

	const filledSegments = Math.floor((progress / 100) * TOTAL_SEGMENTS);

	return (
		<div className="space-y-1">
			{/* Segmented bar */}
			<div className="flex gap-0.5">
				{Array.from({ length: TOTAL_SEGMENTS }).map((_, i) => (
					<div
						key={i}
						className={`h-4 flex-1 rounded-sm transition-all duration-100 ${
							i < filledSegments
								? "bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]"
								: "bg-[var(--bg-tertiary)]"
						}`}
					/>
				))}
			</div>

			{/* Status text */}
			<div className="flex justify-between items-center text-xs mono">
				<span className="text-[var(--text-secondary)]">
					{status === "queued" && "Queued..."}
					{status === "generating" && (
						<>
							Generating<span className="cursor-blink">_</span>
						</>
					)}
					{status === "completed" && "Complete!"}
					{status === "failed" && "Failed"}
				</span>
				<span className="text-[var(--accent)]">{Math.round(progress)}%</span>
			</div>
		</div>
	);
}

// Compact version for inline use
export function RetroProgressBarInline({ progress = 0 }: { progress: number }) {
	const filledSegments = Math.floor((progress / 100) * 10);

	return (
		<span className="mono text-xs inline-flex items-center gap-1">
			<span className="text-[var(--text-secondary)]">[</span>
			{Array.from({ length: 10 }).map((_, i) => (
				<span key={i} className={i < filledSegments ? "text-[var(--accent)]" : "text-[var(--border)]"}>
					{i < filledSegments ? "█" : "░"}
				</span>
			))}
			<span className="text-[var(--text-secondary)]">]</span>
			<span className="text-[var(--accent)] ml-1">{Math.round(progress)}%</span>
		</span>
	);
}
