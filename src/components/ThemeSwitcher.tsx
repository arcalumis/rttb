import { useState } from "react";
import { themes, useTheme, type ThemeName } from "../contexts/ThemeContext";

interface ThemeSwitcherProps {
	compact?: boolean;
}

export function ThemeSwitcher({ compact = false }: ThemeSwitcherProps) {
	const { themeName, setTheme } = useTheme();
	const [isOpen, setIsOpen] = useState(false);

	const themeOptions: ThemeName[] = ["terminal", "anime-night", "phosphor", "clean"];

	if (compact) {
		return (
			<div className="relative">
				<button
					type="button"
					onClick={() => setIsOpen(!isOpen)}
					className="p-2 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
					title="Change theme"
				>
					<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
						/>
					</svg>
				</button>

				{isOpen && (
					<>
						<div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
						<div className="absolute right-0 top-full mt-2 z-50 cyber-card rounded-lg shadow-lg p-2 min-w-40">
							{themeOptions.map((name) => {
								const theme = themes[name];
								return (
									<button
										key={name}
										type="button"
										onClick={() => {
											setTheme(name);
											setIsOpen(false);
										}}
										className={`w-full p-2 text-left text-xs rounded flex items-center gap-2 transition-all ${
											themeName === name
												? "bg-[var(--accent)] text-[var(--bg-primary)]"
												: "hover:bg-[var(--bg-tertiary)]"
										}`}
									>
										<div
											className="w-4 h-4 rounded-full border border-white/20"
											style={{ background: theme.colors.accent }}
										/>
										<span>{theme.label}</span>
										{theme.scanlines && (
											<span className="text-[10px] opacity-60 ml-auto">CRT</span>
										)}
									</button>
								);
							})}
						</div>
					</>
				)}
			</div>
		);
	}

	return (
		<div className="space-y-2">
			<label className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">
				Theme
			</label>
			<div className="grid grid-cols-2 gap-2">
				{themeOptions.map((name) => {
					const theme = themes[name];
					return (
						<button
							key={name}
							type="button"
							onClick={() => setTheme(name)}
							className={`p-3 rounded-lg border text-left transition-all ${
								themeName === name
									? "border-[var(--accent)] bg-[var(--accent)]/10"
									: "border-[var(--border)] hover:border-[var(--accent)]/50"
							}`}
						>
							<div className="flex items-center gap-2 mb-2">
								<div
									className="w-5 h-5 rounded-full"
									style={{ background: theme.colors.accent }}
								/>
								<span className="text-sm font-medium">{theme.label}</span>
							</div>
							{/* Theme preview colors */}
							<div className="flex gap-1">
								<div
									className="w-4 h-4 rounded"
									style={{ background: theme.colors.bgPrimary }}
								/>
								<div
									className="w-4 h-4 rounded"
									style={{ background: theme.colors.bgSecondary }}
								/>
								<div
									className="w-4 h-4 rounded"
									style={{ background: theme.colors.accent }}
								/>
								<div
									className="w-4 h-4 rounded"
									style={{ background: theme.colors.accentAlt }}
								/>
							</div>
							{theme.scanlines && (
								<span className="text-[10px] text-[var(--text-secondary)] mt-1 block">
									+ Scanlines effect
								</span>
							)}
						</button>
					);
				})}
			</div>
		</div>
	);
}
