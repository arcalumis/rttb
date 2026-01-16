import { OlloAvatar } from "./OlloAvatar";

interface WelcomeScreenProps {
	onPromptClick: (prompt: string) => void;
	onCategoryClick: (category: string) => void;
	onStartWithOllo?: () => void;
	onOpenModelGuide?: () => void;
}

const categories = [
	{ id: "portrait", label: "Portrait" },
	{ id: "landscape", label: "Landscape" },
	{ id: "abstract", label: "Abstract" },
	{ id: "photo", label: "Photo" },
];

const suggestions = [
	"A divine being emerging from golden light",
	"Oil painting of a sunset over ancient ruins",
	"Ethereal portrait bathed in warm amber glow",
	"Celestial landscape with radiant sky",
	"Sacred geometry floating in cosmic space",
	"Futuristic city skyline at golden hour",
];

export function WelcomeScreen({ onPromptClick, onCategoryClick, onStartWithOllo, onOpenModelGuide }: WelcomeScreenProps) {
	return (
		<div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
			{/* Main Heading */}
			<h1 className="welcome-heading text-3xl md:text-4xl text-center text-[var(--text-primary)] mb-2">
				What will you create?
			</h1>
			<p className="text-sm text-[var(--text-secondary)] mb-6">
				Describe your vision and let divine inspiration bring it to life
			</p>

			{/* Ollo CTA */}
			{onStartWithOllo && (
				<div className="flex flex-col items-center gap-3 mb-8">
					<button
						type="button"
						onClick={onStartWithOllo}
						className="divine-gradient rounded-xl py-3 px-6 flex items-center gap-3 sacred-glow hover:scale-[1.02] transition-transform"
					>
						<OlloAvatar size="sm" animated={false} />
						<span className="text-base font-semibold">Start building with Ollo</span>
					</button>
					<span className="text-xs text-[var(--text-secondary)]">or dive right in below</span>
				</div>
			)}

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

			{/* Model Guide CTA */}
			{onOpenModelGuide && (
				<button
					type="button"
					onClick={onOpenModelGuide}
					className="mt-12 text-xs text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors flex items-center gap-2"
				>
					<span>New here?</span>
					<span className="text-[var(--accent)] underline underline-offset-2">Check out our model guide</span>
					<span>→</span>
				</button>
			)}
		</div>
	);
}
