export interface OlloOption {
	id: string;
	label: string;
	value: string;
	icon?: string;
	description?: string;
}

export interface OlloMessage {
	id: string;
	type: "ollo" | "user";
	content: string;
	timestamp: string;
	options?: OlloOption[];
	inputType?: "text" | "aspectRatio" | "reference" | "confirm";
}

export interface ProjectMetadata {
	aspectRatio?: string;
	purpose?: string;
	style?: string;
	referenceImages?: string[];
	mood?: string;
	olloEnabled?: boolean;
}

export type OlloPhase =
	| "welcome"
	| "aspectRatio"
	| "purpose"
	| "references"
	| "summary"
	| "ready";

export interface OlloConversation {
	phase: OlloPhase;
	projectMetadata: ProjectMetadata;
	messages: OlloMessage[];
}

export const OLLO_MESSAGES = {
	welcome: [
		"Greetings, creator! I'm Ollo, your guide through the fires of imagination.",
		"The canvas awaits. Shall we kindle something extraordinary together?",
	],
	aspectRatio: [
		"Every great work begins with its frame. What shape calls to you?",
		"The aspect ratio sets the stage for our creation. What feels right?",
	],
	purpose: [
		"What spark of inspiration brings you here today?",
		"Tell me about this vision - what will it become?",
	],
	references: [
		"Do you have any visual references to guide our journey?",
		"Images can inspire without limiting. Would you like to share any?",
	],
	summary: [
		"Wonderful! Here's the creative direction we've charted together.",
	],
	ready: [
		"The forge is ready. Describe your vision, and together we'll bring it to life.",
		"Our creative journey begins now. What shall we create first?",
	],
	encouragement: [
		"A brilliant choice!",
		"I can already sense the potential.",
		"The creative fires burn bright with this direction.",
		"An inspired selection!",
	],
};

export const ASPECT_RATIO_OPTIONS: OlloOption[] = [
	{ id: "1:1", label: "Square", value: "1:1", description: "Perfect for social media and profiles" },
	{ id: "16:9", label: "Landscape", value: "16:9", description: "Cinematic, great for headers and banners" },
	{ id: "9:16", label: "Portrait", value: "9:16", description: "Stories, phone wallpapers, posters" },
	{ id: "4:3", label: "Classic", value: "4:3", description: "Traditional photo format" },
	{ id: "3:4", label: "Portrait Classic", value: "3:4", description: "Classic portrait orientation" },
	{ id: "21:9", label: "Ultrawide", value: "21:9", description: "Cinematic ultrawide format" },
];

export const PURPOSE_OPTIONS: OlloOption[] = [
	{ id: "personal", label: "Personal Project", value: "personal", description: "For your own collection or enjoyment" },
	{ id: "social", label: "Social Media", value: "social", description: "Content for Instagram, Twitter, etc." },
	{ id: "print", label: "Print / Poster", value: "print", description: "Physical prints or wall art" },
	{ id: "concept", label: "Concept Art", value: "concept", description: "Exploring ideas for a larger project" },
	{ id: "reference", label: "Design Reference", value: "reference", description: "Visual reference for other work" },
];
