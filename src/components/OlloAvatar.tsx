interface OlloAvatarProps {
	size?: "sm" | "md" | "lg";
	animated?: boolean;
}

const sizeClasses = {
	sm: "w-8 h-8",
	md: "w-12 h-12",
	lg: "w-16 h-16",
};

const iconSizes = {
	sm: 20,
	md: 28,
	lg: 36,
};

export function OlloAvatar({ size = "md", animated = true }: OlloAvatarProps) {
	const iconSize = iconSizes[size];

	return (
		<div
			className={`${sizeClasses[size]} rounded-full flex items-center justify-center ${animated ? "ollo-avatar" : ""}`}
			style={{
				background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-alt) 100%)",
			}}
		>
			<svg
				width={iconSize}
				height={iconSize}
				viewBox="0 0 24 24"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				{/* Sun/flame hybrid - divine fire symbol */}
				<circle
					cx="12"
					cy="12"
					r="5"
					fill="var(--bg-primary)"
					opacity="0.9"
				/>
				{/* Radiating rays */}
				<g stroke="var(--bg-primary)" strokeWidth="2" strokeLinecap="round">
					<line x1="12" y1="2" x2="12" y2="5" />
					<line x1="12" y1="19" x2="12" y2="22" />
					<line x1="2" y1="12" x2="5" y2="12" />
					<line x1="19" y1="12" x2="22" y2="12" />
					<line x1="4.93" y1="4.93" x2="7.05" y2="7.05" />
					<line x1="16.95" y1="16.95" x2="19.07" y2="19.07" />
					<line x1="4.93" y1="19.07" x2="7.05" y2="16.95" />
					<line x1="16.95" y1="7.05" x2="19.07" y2="4.93" />
				</g>
				{/* Inner glow dot */}
				<circle
					cx="12"
					cy="12"
					r="2"
					fill="var(--accent)"
				/>
			</svg>
		</div>
	);
}
