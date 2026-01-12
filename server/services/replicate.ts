import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import Replicate from "replicate";
import type { Model } from "../../src/types";

// Default Replicate client uses REPLICATE_API_TOKEN from env
const defaultReplicate = new Replicate();

/**
 * Create a Replicate client with a custom API key or use default
 */
function getReplicateClient(apiKey?: string): Replicate {
	if (apiKey) {
		return new Replicate({ auth: apiKey });
	}
	return defaultReplicate;
}

export interface ExtendedModel extends Model {
	supportsImageInput: boolean;
	maxImages?: number;
}

export const MODELS: ExtendedModel[] = [
	{
		id: "black-forest-labs/flux-schnell",
		name: "FLUX.1 Schnell",
		description: "Fastest FLUX model, great for quick iterations (4 steps)",
		defaultParams: { num_inference_steps: 4 },
		supportsImageInput: false,
	},
	{
		id: "black-forest-labs/flux-dev",
		name: "FLUX.1 Dev",
		description: "Development model with excellent quality (28 steps)",
		defaultParams: { num_inference_steps: 28 },
		supportsImageInput: false,
	},
	{
		id: "black-forest-labs/flux-1.1-pro",
		name: "FLUX 1.1 Pro",
		description: "Highest quality FLUX model",
		defaultParams: {},
		supportsImageInput: false,
	},
	{
		id: "google/nano-banana-pro",
		name: "Nano Banana Pro",
		description: "Google's image gen/edit with text, real-time info, up to 14 input images",
		defaultParams: {
			resolution: "2K",
			aspect_ratio: "4:3",
			output_format: "png",
			safety_filter_level: "block_only_high",
		},
		supportsImageInput: true,
		maxImages: 14,
	},
];

export interface GenerationResult {
	id: string;
	replicateId: string;
	imagePath: string;
	imageUrl: string;
	cost: number;
	predictTime: number;
}

export interface GenerateOptions {
	width?: number;
	height?: number;
	numOutputs?: number;
	imageInputs?: string[]; // Local file paths for image inputs
	aspectRatio?: string;
	resolution?: string;
	outputFormat?: string;
	apiKey?: string; // Optional BYO API key
}

// Convert local file to base64 data URI
function fileToDataUri(filePath: string): string {
	const buffer = fs.readFileSync(filePath);
	const ext = path.extname(filePath).toLowerCase();
	const mimeTypes: Record<string, string> = {
		".png": "image/png",
		".jpg": "image/jpeg",
		".jpeg": "image/jpeg",
		".gif": "image/gif",
		".webp": "image/webp",
	};
	const mimeType = mimeTypes[ext] || "image/png";
	return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

export async function generateImage(
	prompt: string,
	model = "black-forest-labs/flux-schnell",
	options: GenerateOptions = {},
): Promise<GenerationResult[]> {
	const { width = 1024, height = 1024, numOutputs = 1, imageInputs = [], apiKey } = options;
	const replicate = getReplicateClient(apiKey);

	let input: Record<string, unknown>;

	if (model === "google/nano-banana-pro") {
		// Convert local file paths to data URIs for Replicate
		const imageDataUris = imageInputs
			.map((inputPath) => {
				let fullPath: string;

				// Handle /uploads/xxx.png paths
				if (inputPath.includes("/uploads/")) {
					const filename = inputPath.split("/uploads/").pop();
					if (!filename) return null;
					fullPath = path.join(process.cwd(), "uploads", filename);
				}
				// Handle /images/xxx.png paths (generated images)
				else if (inputPath.includes("/images/")) {
					const filename = inputPath.split("/images/").pop();
					if (!filename) return null;
					fullPath = path.join(process.cwd(), "generated-images", filename);
				} else {
					console.log("Unknown image path format:", inputPath);
					return null;
				}

				if (!fs.existsSync(fullPath)) {
					console.log("File not found:", fullPath);
					return null;
				}
				return fileToDataUri(fullPath);
			})
			.filter((uri): uri is string => uri !== null);

		// Nano Banana Pro specific inputs
		input = {
			prompt,
			image_input: imageDataUris,
			resolution: options.resolution || "2K",
			aspect_ratio: options.aspectRatio || "4:3",
			output_format: options.outputFormat || "png",
			safety_filter_level: "block_only_high",
		};
	} else {
		// FLUX models
		input = {
			prompt,
			num_outputs: numOutputs,
			aspect_ratio: "1:1",
		};

		if (model.includes("flux-schnell") || model.includes("flux-dev")) {
			input.width = width;
			input.height = height;
			input.aspect_ratio = undefined;
		}
	}

	// Use predictions API to get the prediction ID for cost tracking
	const prediction = await replicate.predictions.create({
		model: model as `${string}/${string}`,
		input,
	});

	// Poll for completion
	let finalPrediction = prediction;
	while (finalPrediction.status !== "succeeded" && finalPrediction.status !== "failed") {
		await new Promise((resolve) => setTimeout(resolve, 1000));
		finalPrediction = await replicate.predictions.get(prediction.id);
	}

	if (finalPrediction.status === "failed") {
		throw new Error(finalPrediction.error || "Generation failed");
	}

	// Get cost from metrics
	const predictTime = finalPrediction.metrics?.predict_time || 0;
	// Approximate cost based on predict time (varies by model)
	const cost = predictTime * 0.001; // ~$0.001 per second as rough estimate

	const output = finalPrediction.output;
	console.log("Replicate output:", output);

	const results: GenerationResult[] = [];
	const outputArray = Array.isArray(output) ? output : [output];

	for (const item of outputArray) {
		const imageUrl = String(item);
		console.log("Image URL:", imageUrl);

		if (!imageUrl || !imageUrl.startsWith("http")) {
			console.log("Skipping invalid item:", item);
			continue;
		}

		// Download and save the image
		const id = crypto.randomUUID();
		const ext = imageUrl.includes(".png") ? "png" : "webp";
		const filename = `${id}.${ext}`;
		const filePath = path.join(process.cwd(), "generated-images", filename);

		const response = await fetch(imageUrl);
		const buffer = Buffer.from(await response.arrayBuffer());
		fs.writeFileSync(filePath, buffer);

		results.push({
			id,
			replicateId: prediction.id,
			imagePath: filename,
			imageUrl: `/images/${filename}`,
			cost,
			predictTime,
		});
	}

	return results;
}

export function getModels(): ExtendedModel[] {
	return MODELS;
}
