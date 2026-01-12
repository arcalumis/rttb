export interface Generation {
	id: string;
	prompt: string;
	model: string;
	modelVersion?: string;
	imagePath: string;
	imageUrl?: string;
	width?: number;
	height?: number;
	parameters?: Record<string, unknown>;
	createdAt: string;
	replicateId?: string;
	cost?: number;
	deletedAt?: string;
	archivedAt?: string;
}

export interface Model {
	id: string;
	name: string;
	description: string;
	defaultParams?: Record<string, unknown>;
	supportsImageInput?: boolean;
	maxImages?: number;
	avgGenerationTime?: number | null;
	sampleCount?: number;
}

export interface GenerateRequest {
	prompt: string;
	model?: string;
	width?: number;
	height?: number;
	numOutputs?: number;
	imageInputs?: string[];
	aspectRatio?: string;
	resolution?: string;
	outputFormat?: string;
}

export interface GenerateResponse {
	id: string;
	status: "starting" | "processing" | "succeeded" | "failed";
	images?: { id: string; url: string; cost?: number }[];
	cost?: number;
	error?: string;
}

export interface HistoryResponse {
	generations: Generation[];
	total: number;
	page: number;
	limit: number;
	totalCost?: number;
}

export interface ModelsResponse {
	models: Model[];
}

export interface User {
	id: string;
	username: string;
	isAdmin: boolean;
}

export interface AuthResponse {
	token: string;
	user: User;
}

export interface Upload {
	id: string;
	filename: string;
	originalName: string;
	imageUrl: string;
	createdAt?: string;
	deletedAt?: string;
	archivedAt?: string;
	isUpload?: boolean;
}

export interface UploadsResponse {
	uploads: Upload[];
}

// Admin types
export interface SubscriptionProduct {
	id: string;
	name: string;
	description: string | null;
	monthlyImageLimit: number | null;
	monthlyCostLimit: number | null;
	bonusCredits: number;
	price: number;
	isActive: boolean;
	createdAt: string;
	activeUsers?: number;
}

export interface UserSubscription {
	productId: string;
	productName: string;
	startsAt: string;
	endsAt: string | null;
}

export interface UserUsage {
	imageCount: number;
	totalCost: number;
	usedOwnKey: number;
}

export interface AdminUser {
	id: string;
	username: string;
	email: string | null;
	isAdmin: boolean;
	isActive: boolean;
	createdAt: string;
	lastLogin: string | null;
	currentMonth: UserUsage;
	subscription: UserSubscription | null;
	credits: number;
}

export interface AdminUserDetail extends AdminUser {
	hasApiKey: boolean;
	usageHistory: {
		yearMonth: string;
		imageCount: number;
		totalCost: number;
		usedOwnKey: number;
	}[];
	subscriptionHistory: {
		id: string;
		productId: string;
		productName: string;
		startsAt: string;
		endsAt: string | null;
		createdAt: string;
	}[];
	creditHistory: {
		id: string;
		type: string;
		amount: number;
		reason: string;
		createdAt: string;
	}[];
}

export interface AdminStats {
	totalUsers: number;
	totalGenerations: number;
	totalCost: number;
	thisMonth: {
		imageCount: number;
		totalCost: number;
	};
	recentUsers: {
		id: string;
		username: string;
		created_at: string;
	}[];
}

// User settings types
export interface UserSubscriptionInfo {
	subscription: {
		id: string;
		name: string;
		description: string | null;
		price: number;
	} | null;
	limits: {
		monthlyImageLimit: number | null;
		monthlyCostLimit: number | null;
	} | null;
}

export interface UserUsageInfo {
	yearMonth: string;
	usage: UserUsage;
	canGenerate: boolean;
	limitReason?: string;
	limits?: {
		monthlyImageLimit: number | null;
		monthlyCostLimit: number | null;
	};
}

export interface UserCredits {
	credits: number;
	history: {
		id: string;
		type: string;
		amount: number;
		reason: string | null;
		createdAt: string;
	}[];
}

export interface UserApiKeyInfo {
	hasKey: boolean;
	maskedKey?: string;
	createdAt?: string;
}

// Generation queue types
export interface QueuedGeneration {
	id: string;
	prompt: string;
	model: string;
	status: "queued" | "generating" | "completed" | "failed";
	createdAt: string;
	error?: string;
	result?: Generation;
	startedAt?: string;
	estimatedDuration?: number;
}
