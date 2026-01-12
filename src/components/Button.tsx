import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "success";
type ButtonSize = "xs" | "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	size?: ButtonSize;
	children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
	primary: "cyber-button",
	secondary: "cyber-card hover:neon-border",
	danger: "bg-red-500/20 text-red-400 hover:bg-red-500/30",
	ghost: "hover:bg-cyan-500/10 text-gray-400 hover:text-cyan-400",
	success: "bg-cyan-600 hover:bg-cyan-500",
};

const sizeClasses: Record<ButtonSize, string> = {
	xs: "px-2 py-0.5 text-xs",
	sm: "px-3 py-1.5 text-xs",
	md: "px-4 py-2 text-sm",
};

export function Button({
	variant = "secondary",
	size = "sm",
	className = "",
	children,
	disabled,
	...props
}: ButtonProps) {
	return (
		<button
			type="button"
			className={`rounded transition-all ${variantClasses[variant]} ${sizeClasses[size]} ${
				disabled ? "opacity-50 cursor-not-allowed" : ""
			} ${className}`}
			disabled={disabled}
			{...props}
		>
			{children}
		</button>
	);
}
