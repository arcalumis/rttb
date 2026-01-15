import { useCallback, useEffect, useState } from "react";
import type { OlloMessage as OlloMessageType, OlloOption, OlloPhase, ProjectMetadata } from "../types/ollo";
import { ASPECT_RATIO_OPTIONS, OLLO_MESSAGES, PURPOSE_OPTIONS } from "../types/ollo";
import { OlloAvatar } from "./OlloAvatar";
import { OlloMessage, OlloTypingIndicator } from "./OlloMessage";

interface OlloWelcomeFlowProps {
	isOpen: boolean;
	onClose: () => void;
	onComplete: (metadata: ProjectMetadata) => void;
	onSkip: () => void;
}

function getRandomMessage(messages: string[]): string {
	return messages[Math.floor(Math.random() * messages.length)];
}

function generateId(): string {
	return Math.random().toString(36).substring(2, 9);
}

export function OlloWelcomeFlow({ isOpen, onClose, onComplete, onSkip }: OlloWelcomeFlowProps) {
	const [phase, setPhase] = useState<OlloPhase>("welcome");
	const [messages, setMessages] = useState<OlloMessageType[]>([]);
	const [metadata, setMetadata] = useState<ProjectMetadata>({});
	const [isTyping, setIsTyping] = useState(false);

	const addOlloMessage = useCallback((content: string, options?: OlloOption[]) => {
		setIsTyping(true);
		setTimeout(() => {
			setIsTyping(false);
			setMessages((prev) => [
				...prev,
				{
					id: generateId(),
					type: "ollo",
					content,
					timestamp: new Date().toISOString(),
					options,
				},
			]);
		}, 600);
	}, []);

	const addUserMessage = useCallback((content: string) => {
		setMessages((prev) => [
			...prev,
			{
				id: generateId(),
				type: "user",
				content,
				timestamp: new Date().toISOString(),
			},
		]);
	}, []);

	// Initialize conversation
	useEffect(() => {
		if (isOpen && messages.length === 0) {
			addOlloMessage(getRandomMessage(OLLO_MESSAGES.welcome), [
				{ id: "start", label: "Let's create together", value: "start" },
				{ id: "skip", label: "I'll dive right in", value: "skip" },
			]);
		}
	}, [isOpen, messages.length, addOlloMessage]);

	// Reset on close
	useEffect(() => {
		if (!isOpen) {
			setPhase("welcome");
			setMessages([]);
			setMetadata({});
			setIsTyping(false);
		}
	}, [isOpen]);

	const handleOptionSelect = (option: OlloOption) => {
		addUserMessage(option.label);

		switch (phase) {
			case "welcome":
				if (option.value === "skip") {
					setTimeout(() => onSkip(), 300);
					return;
				}
				setPhase("aspectRatio");
				setTimeout(() => {
					addOlloMessage(getRandomMessage(OLLO_MESSAGES.aspectRatio), ASPECT_RATIO_OPTIONS);
				}, 400);
				break;

			case "aspectRatio":
				setMetadata((prev) => ({ ...prev, aspectRatio: option.value }));
				setPhase("purpose");
				setTimeout(() => {
					addOlloMessage(
						`${getRandomMessage(OLLO_MESSAGES.encouragement)} ${getRandomMessage(OLLO_MESSAGES.purpose)}`,
						PURPOSE_OPTIONS
					);
				}, 400);
				break;

			case "purpose":
				setMetadata((prev) => ({ ...prev, purpose: option.value }));
				setPhase("ready");
				setTimeout(() => {
					addOlloMessage(getRandomMessage(OLLO_MESSAGES.ready));
					// Small delay then complete
					setTimeout(() => {
						onComplete({ ...metadata, purpose: option.value, olloEnabled: true });
					}, 800);
				}, 400);
				break;

			default:
				break;
		}
	};

	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
			onClick={onClose}
			onKeyDown={(e) => e.key === "Escape" && onClose()}
		>
			<div
				className="cyber-card divine-border rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden"
				onClick={(e) => e.stopPropagation()}
				onKeyDown={() => {}}
			>
				{/* Header */}
				<div className="flex items-center gap-3 p-4 border-b border-[var(--accent)]/20">
					<OlloAvatar size="md" />
					<div>
						<h2 className="text-lg font-semibold text-[var(--text-primary)]">Ollo</h2>
						<p className="text-xs text-[var(--text-secondary)]">Your creative guide</p>
					</div>
				</div>

				{/* Messages */}
				<div className="flex-1 overflow-y-auto p-4 space-y-4">
					{messages.map((msg, index) => (
						<OlloMessage
							key={msg.id}
							message={msg}
							onOptionSelect={handleOptionSelect}
							isLatest={index === messages.length - 1 && msg.type === "ollo"}
						/>
					))}
					{isTyping && <OlloTypingIndicator />}
				</div>

				{/* Progress indicator */}
				<div className="px-4 pb-4">
					<div className="flex gap-2 justify-center">
						{["welcome", "aspectRatio", "purpose", "ready"].map((p) => (
							<div
								key={p}
								className={`w-2 h-2 rounded-full transition-all ${
									phase === p
										? "bg-[var(--accent)] sacred-glow"
										: phases.indexOf(phase) > phases.indexOf(p as OlloPhase)
										? "bg-[var(--accent)]/60"
										: "bg-[var(--border)]"
								}`}
							/>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

const phases: OlloPhase[] = ["welcome", "aspectRatio", "purpose", "references", "summary", "ready"];
