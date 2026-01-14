interface WelcomeScreenProps {
	onPromptClick: (prompt: string) => void;
	onCategoryClick: (category: string) => void;
}

const categories = [
	{ id: "portrait", label: "Portrait" },
	{ id: "landscape", label: "Landscape" },
	{ id: "abstract", label: "Abstract" },
	{ id: "photo", label: "Photo" },
];

const suggestions = [
	"A samurai standing in neon rain, cyberpunk aesthetic",
	"Vintage anime screenshot, 90s style cel animation",
	"Retro sci-fi movie poster with bold typography",
	"Oil painting of a sunset over ancient ruins",
	"Minimalist logo design, geometric shapes",
	"Futuristic city skyline at golden hour",
];

export function WelcomeScreen({ onPromptClick, onCategoryClick }: WelcomeScreenProps) {
	return (
		<div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
			{/* Main Heading */}
			<h1 className="welcome-heading text-3xl md:text-4xl text-center text-[var(--text-primary)] mb-2">
				What will you create?
			</h1>
			<p className="text-sm text-[var(--text-secondary)] mb-8">
				Describe your vision and let AI bring it to life
			</p>

			{/* Category Pills */}
			<div className="flex flex-wrap justify-center gap-2 mb-10">
				{categories.map((cat) => (
					<button
						key={cat.id}
						type="button"
						onClick={() => onCategoryClick(cat.id)}
						className="action-pill"
					>
						{cat.label}
					</button>
				))}
			</div>

			{/* Suggestions */}
			<div className="w-full max-w-lg space-y-2">
				<p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-3 text-center">
					Try one of these
				</p>
				<div className="grid gap-2">
					{suggestions.map((prompt) => (
						<button
							key={prompt}
							type="button"
							onClick={() => onPromptClick(prompt)}
							className="suggestion-card"
						>
							<span className="text-[var(--accent)] mr-2">→</span>
							{prompt}
						</button>
					))}
				</div>
			</div>

			{/* Decorative Element */}
			<div className="mt-12 flex items-center gap-3 text-xs text-[var(--text-secondary)]">
				<div className="w-8 h-px bg-[var(--border)]" />
				<span className="mono">powered by FLUX + Nano Banana</span>
				<div className="w-8 h-px bg-[var(--border)]" />
			</div>
		</div>
	);
}
