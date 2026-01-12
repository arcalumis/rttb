import { forwardRef, useImperativeHandle, useRef, useState } from "react";

interface PromptInputProps {
	onGenerate: (prompt: string) => void;
	loading?: boolean;
	disabled?: boolean;
	queueCount?: number;
}

export interface PromptInputRef {
	focus: () => void;
}

export const PromptInput = forwardRef<PromptInputRef, PromptInputProps>(
	function PromptInput({ onGenerate, loading, disabled, queueCount = 0 }, ref) {
	const [prompt, setPrompt] = useState("");
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	useImperativeHandle(ref, () => ({
		focus: () => {
			textareaRef.current?.focus();
		},
	}));

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (prompt.trim() && !disabled) {
			onGenerate(prompt.trim());
			setPrompt("");
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit(e);
		}
	};

	const isGenerating = queueCount > 0 || loading;

	return (
		<form onSubmit={handleSubmit} className="w-full">
			<div className="flex gap-2">
				<textarea
					ref={textareaRef}
					id="prompt"
					value={prompt}
					onChange={(e) => setPrompt(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder="Describe your vision..."
					disabled={disabled}
					rows={2}
					className="cyber-input flex-1 px-3 py-2 rounded text-white text-sm placeholder-gray-500 resize-none"
				/>
				<button
					type="submit"
					disabled={!prompt.trim() || disabled}
					className="cyber-button px-4 py-2 rounded font-medium text-white text-sm self-end"
				>
					{isGenerating ? (
						<span className="flex items-center gap-1.5">
							<svg
								className="animate-spin h-4 w-4"
								viewBox="0 0 24 24"
								role="img"
								aria-label="Loading"
							>
								<circle
									className="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									strokeWidth="4"
									fill="none"
								/>
								<path
									className="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								/>
							</svg>
							{queueCount > 0 ? queueCount : "+"}
						</span>
					) : (
						"Go"
					)}
				</button>
			</div>
		</form>
	);
});
