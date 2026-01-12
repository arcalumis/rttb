import type { FastifyInstance } from "fastify";
import { getDb } from "../db";
import { getModels } from "../services/replicate";

interface ModelStats {
	model: string;
	avg_time: number;
	sample_count: number;
}

export async function modelsRoutes(fastify: FastifyInstance): Promise<void> {
	fastify.get("/api/models", async () => {
		const models = getModels();
		const db = getDb();

		// Calculate average predict_time per model from recent generations
		const statsQuery = `
			SELECT
				model,
				AVG(predict_time) as avg_time,
				COUNT(*) as sample_count
			FROM generations
			WHERE predict_time IS NOT NULL AND deleted_at IS NULL
			GROUP BY model
		`;

		const stats = db.prepare(statsQuery).all() as ModelStats[];

		// Create lookup map
		const statsMap = new Map(stats.map((s) => [s.model, s]));

		// Merge stats into models
		const modelsWithStats = models.map((m) => ({
			...m,
			avgGenerationTime: statsMap.get(m.id)?.avg_time || null,
			sampleCount: statsMap.get(m.id)?.sample_count || 0,
		}));

		return { models: modelsWithStats };
	});
}
