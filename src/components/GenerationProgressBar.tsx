import { useEffect, useState } from "react";

interface GenerationProgressBarProps {
	startedAt: string;
	estimatedDuration: number;
	status: "queued" | "generating" | "completed" | "failed";
}

export function GenerationProgressBar({
	startedAt,
	estimatedDuration,
	status,
}: GenerationProgressBarProps) {
	const [elapsedSeconds, setElapsedSeconds] = useState(0);

	useEffect(() => {
		if (status !== "generating") return;

		const startTime = new Date(startedAt).getTime();

		const updateElapsed = () => {
			const now = Date.now();
			const elapsed = (now - startTime) / 1000;
			setElapsedSeconds(elapsed);
		};

		// Update every 100ms for smooth animation
		updateElapsed();
		const interval = setInterval(updateElapsed, 100);

		return () => clearInterval(interval);
	}, [startedAt, status]);

	if (status !== "generating") return null;

	// Calculate progress (cap at 95% to show it's still working)
	const progress = Math.min(95, (elapsedSeconds / estimatedDuration) * 100);
	const remaining = Math.max(0, estimatedDuration - elapsedSeconds);

	// Format remaining time
	const formatTime = (seconds: number): string => {
		if (seconds < 1) return "<1s";
		if (seconds < 60) return `${Math.ceil(seconds)}s`;
		const mins = Math.floor(seconds / 60);
		const secs = Math.ceil(seconds % 60);
		return `${mins}m ${secs}s`;
	};

	return (
		<div className="w-full space-y-1">
			{/* Progress bar container */}
			<div className="h-1 bg-gray-800 rounded-full overflow-hidden">
				<div
					className="h-full bg-gradient-to-r from-cyan-500 to-pink-500 transition-all duration-100 ease-linear"
					style={{ width: `${progress}%` }}
				/>
			</div>
			{/* Time estimate */}
			<div className="text-[9px] text-cyan-400/70 text-center">
				{remaining > 0 ? `~${formatTime(remaining)}` : "Almost done..."}
			</div>
		</div>
	);
}
