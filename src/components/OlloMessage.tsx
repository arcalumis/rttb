import { OlloAvatar } from "./OlloAvatar";
import type { OlloMessage as OlloMessageType, OlloOption } from "../types/ollo";

interface OlloMessageProps {
	message: OlloMessageType;
	onOptionSelect?: (option: OlloOption) => void;
	isLatest?: boolean;
}

export function OlloMessage({ message, onOptionSelect, isLatest = false }: OlloMessageProps) {
	const isOllo = message.type === "ollo";

	return (
		<div className={`flex gap-3 ${isOllo ? "" : "flex-row-reverse"}`}>
			{isOllo && <OlloAvatar size="sm" animated={isLatest} />}

			<div className={`flex-1 max-w-[85%] ${isOllo ? "" : "flex justify-end"}`}>
				<div
					className={`rounded-xl px-4 py-3 ${
						isOllo
							? "ollo-message"
							: "bg-[var(--bg-tertiary)] border border-[var(--border)]"
					}`}
				>
					<p className="text-[var(--text-primary)] text-sm leading-relaxed">
						{message.content}
					</p>
				</div>

				{isOllo && message.options && message.options.length > 0 && (
					<div className="mt-3 flex flex-wrap gap-2">
						{message.options.map((option) => (
							<button
								key={option.id}
								type="button"
								onClick={() => onOptionSelect?.(option)}
								className="ollo-option px-4 py-2 rounded-lg text-sm text-[var(--text-primary)] flex flex-col items-start"
							>
								<span className="font-medium">{option.label}</span>
								{option.description && (
									<span className="text-xs text-[var(--text-secondary)] mt-0.5">
										{option.description}
									</span>
								)}
							</button>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

interface OlloTypingIndicatorProps {
	className?: string;
}

export function OlloTypingIndicator({ className = "" }: OlloTypingIndicatorProps) {
	return (
		<div className={`flex gap-3 ${className}`}>
			<OlloAvatar size="sm" animated />
			<div className="ollo-message rounded-xl px-4 py-3 flex items-center gap-1.5">
				<span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
				<span
					className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse"
					style={{ animationDelay: "0.2s" }}
				/>
				<span
					className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse"
					style={{ animationDelay: "0.4s" }}
				/>
			</div>
		</div>
	);
}
