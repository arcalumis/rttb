import type { ReactNode } from "react";
import { IconClose } from "./Icons";

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	children: ReactNode;
	size?: "sm" | "md" | "lg" | "xl";
	footer?: ReactNode;
}

const sizeClasses = {
	sm: "max-w-sm",
	md: "max-w-md",
	lg: "max-w-2xl",
	xl: "max-w-4xl",
};

export function Modal({ isOpen, onClose, title, children, size = "sm", footer }: ModalProps) {
	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
			onClick={onClose}
			onKeyDown={(e) => e.key === "Escape" && onClose()}
		>
			<div
				className={`cyber-card neon-border rounded-lg w-full ${sizeClasses[size]} max-h-[80vh] flex flex-col`}
				onClick={(e) => e.stopPropagation()}
				onKeyDown={() => {}}
			>
				{/* Header */}
				<div className="flex items-center justify-between p-3 border-b border-cyan-500/20">
					<h2 className="text-sm font-semibold gradient-text">{title}</h2>
					<button
						type="button"
						onClick={onClose}
						className="p-1 hover:bg-pink-500/20 rounded transition-colors"
					>
						<IconClose className="w-4 h-4" />
					</button>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto p-3">
					{children}
				</div>

				{/* Footer (optional) */}
				{footer && (
					<div className="p-3 border-t border-cyan-500/20">
						{footer}
					</div>
				)}
			</div>
		</div>
	);
}
