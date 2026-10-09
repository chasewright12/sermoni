import type { FastifyInstance } from "fastify";
import {
    MetricsSchema,
    type Metrics
} from "../schemas/metrics.schema";
import { request } from "node:http";

let latestMetrics: Metrics | null = null;

export async function metricsRoutes(app: FastifyInstance) {
    app.post("/metrics", async (request, reply) => {
        const result = MetricsSchema.safeParse(request.body);

        if (!result.success) {
            return reply.status(400).send({
                error: "Invalid metrics",
                details: result.error.issues
            });
        }

        latestMetrics = result.data;

        return reply.status(201).send({
            success: true,
            message: "Metrics received successfully."
        });
    });

    app.get("/metrics", async (_request, reply) => {
        if (latestMetrics === null) {
            return reply.status(404).send({
                error: "No metrics received yet."
            });
        }

        return reply.send(latestMetrics);
    });
}