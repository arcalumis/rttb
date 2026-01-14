import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeName = "terminal" | "anime-night" | "phosphor" | "clean";

export interface ThemeColors {
	bgPrimary: string;
	bgSecondary: string;
	bgTertiary: string;
	accent: string;
	accentAlt: string;
	textPrimary: string;
	textSecondary: string;
	border: string;
	cardBg: string;
	cardBorder: string;
}

export interface Theme {
	name: ThemeName;
	label: string;
	colors: ThemeColors;
	scanlines?: boolean;
}

export const themes: Record<ThemeName, Theme> = {
	terminal: {
		name: "terminal",
		label: "Terminal",
		colors: {
			bgPrimary: "#1c1c1c",
			bgSecondary: "#252525",
			bgTertiary: "#2f2f2f",
			accent: "#00ff41",
			accentAlt: "#ff6b35",
			textPrimary: "#e0e0e0",
			textSecondary: "#888888",
			border: "#3a3a3a",
			cardBg: "rgba(28, 28, 28, 0.9)",
			cardBorder: "rgba(0, 255, 65, 0.2)",
		},
	},
	"anime-night": {
		name: "anime-night",
		label: "Anime Night",
		colors: {
			bgPrimary: "#0f0f1a",
			bgSecondary: "#161625",
			bgTertiary: "#1d1d30",
			accent: "#ff4d6d",
			accentAlt: "#00d4ff",
			textPrimary: "#f0f0f0",
			textSecondary: "#8888aa",
			border: "#2a2a4a",
			cardBg: "rgba(15, 15, 26, 0.9)",
			cardBorder: "rgba(255, 77, 109, 0.2)",
		},
	},
	phosphor: {
		name: "phosphor",
		label: "Phosphor",
		colors: {
			bgPrimary: "#0a0a0a",
			bgSecondary: "#0f0f0f",
			bgTertiary: "#141414",
			accent: "#33ff33",
			accentAlt: "#33ff33",
			textPrimary: "#33ff33",
			textSecondary: "#228822",
			border: "#1a3a1a",
			cardBg: "rgba(10, 10, 10, 0.95)",
			cardBorder: "rgba(51, 255, 51, 0.3)",
		},
		scanlines: true,
	},
	clean: {
		name: "clean",
		label: "Clean",
		colors: {
			bgPrimary: "#18181b",
			bgSecondary: "#1f1f23",
			bgTertiary: "#27272a",
			accent: "#a855f7",
			accentAlt: "#06b6d4",
			textPrimary: "#fafafa",
			textSecondary: "#a1a1aa",
			border: "#3f3f46",
			cardBg: "rgba(24, 24, 27, 0.9)",
			cardBorder: "rgba(168, 85, 247, 0.2)",
		},
	},
};

interface ThemeContextValue {
	theme: Theme;
	themeName: ThemeName;
	setTheme: (name: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [themeName, setThemeName] = useState<ThemeName>(() => {
		const stored = localStorage.getItem("theme");
		if (stored && stored in themes) {
			return stored as ThemeName;
		}
		return "terminal";
	});

	const theme = themes[themeName];

	const setTheme = useCallback((name: ThemeName) => {
		setThemeName(name);
		localStorage.setItem("theme", name);
	}, []);

	// Apply theme CSS variables to document root
	useEffect(() => {
		const root = document.documentElement;
		const { colors, scanlines } = theme;

		root.style.setProperty("--bg-primary", colors.bgPrimary);
		root.style.setProperty("--bg-secondary", colors.bgSecondary);
		root.style.setProperty("--bg-tertiary", colors.bgTertiary);
		root.style.setProperty("--accent", colors.accent);
		root.style.setProperty("--accent-alt", colors.accentAlt);
		root.style.setProperty("--text-primary", colors.textPrimary);
		root.style.setProperty("--text-secondary", colors.textSecondary);
		root.style.setProperty("--border", colors.border);
		root.style.setProperty("--card-bg", colors.cardBg);
		root.style.setProperty("--card-border", colors.cardBorder);

		// Toggle scanlines class
		if (scanlines) {
			root.classList.add("scanlines");
		} else {
			root.classList.remove("scanlines");
		}
	}, [theme]);

	return <ThemeContext.Provider value={{ theme, themeName, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
}
