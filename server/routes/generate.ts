import type { FastifyInstance } from "fastify";
import type { GenerateRequest } from "../../src/types";
import { getDb } from "../db";
import { authMiddleware } from "../middleware/auth";
import { generateImage } from "../services/replicate";
import { canUserGenerate, deductCredit, recordUsage } from "../services/usage";
import { getUserApiKey } from "./user";

interface ExtendedGenerateRequest extends GenerateRequest {
	imageInputs?: string[];
	aspectRatio?: string;
	resolution?: string;
	outputFormat?: string;
}

export async function generateRoutes(fastify: FastifyInstance): Promise<void> {
	fastify.post<{ Body: ExtendedGenerateRequest }>(
		"/api/generate",
		{ preHandler: authMiddleware },
		async (request, reply) => {
			const {
				prompt,
				model,
				width,
				height,
				numOutputs,
				imageInputs,
				aspectRatio,
				resolution,
				outputFormat,
			} = request.body;

			const userId = request.user?.userId;
			if (!userId) {
				return reply.status(401).send({ error: "Unauthorized" });
			}

			if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
				return reply.status(400).send({ error: "Prompt is required" });
			}

			// Check if user can generate based on subscription limits
			const limitCheck = canUserGenerate(userId);
			if (!limitCheck.allowed) {
				return reply.status(403).send({
					error: limitCheck.reason || "Generation limit reached",
					limitReached: true,
					usage: limitCheck.usage,
					limits: limitCheck.limits,
				});
			}

			// Check if user needs to use credits (over limit but has credits)
			const needsCredit =
				limitCheck.subscription?.monthly_image_limit !== null &&
				limitCheck.usage &&
				limitCheck.usage.imageCount >= (limitCheck.subscription?.monthly_image_limit || 0);

			// Get user's API key if they have one
			const userApiKey = getUserApiKey(userId);
			const usedOwnKey = !!userApiKey;

			try {
				const results = await generateImage(prompt, model, {
					width,
					height,
					numOutputs,
					imageInputs,
					aspectRatio,
					resolution,
					outputFormat,
					apiKey: userApiKey || undefined,
				});

				const totalCost = results.reduce((sum, r) => sum + r.cost, 0);

				// Record usage
				recordUsage(userId, totalCost, usedOwnKey);

				// Deduct credit if needed
				if (needsCredit) {
					deductCredit(userId, "Used bonus credit for generation");
				}

				const db = getDb();
				const insertStmt = db.prepare(`
				INSERT INTO generations (id, prompt, model, image_path, width, height, parameters, user_id, cost, replicate_id, predict_time)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			`);

				const images = results.map((result) => {
					insertStmt.run(
						result.id,
						prompt.trim(),
						model || "black-forest-labs/flux-schnell",
						result.imagePath,
						width || 1024,
						height || 1024,
						JSON.stringify({ numOutputs, imageInputs, aspectRatio, resolution, outputFormat }),
						userId,
						result.cost,
						result.replicateId,
						result.predictTime,
					);

					return {
						id: result.id,
						url: result.imageUrl,
						cost: result.cost,
					};
				});

				return {
					id: results[0]?.id,
					status: "succeeded",
					images,
					cost: totalCost,
					usedOwnKey,
				};
			} catch (error) {
				fastify.log.error(error);
				const message = error instanceof Error ? error.message : "Generation failed";
				return reply.status(500).send({
					status: "failed",
					error: message,
				});
			}
		},
	);
}
