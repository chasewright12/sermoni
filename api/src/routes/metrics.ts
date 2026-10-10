
import type { FastifyInstance } from "fastify";
import {
    MetricsSchema,
    type Metrics
} from "../schemas/metrics.schema";
import { pool } from "../db";

export async function metricsRoutes(app: FastifyInstance) {
    app.post("/metrics", async (request, reply) => {
        const result = MetricsSchema.safeParse(request.body);

        if (!result.success) {
            return reply.status(400).send({
                error: "Invalid metrics",
                details: result.error.issues
            });
        }

        const metrics: Metrics = result.data;
        const timestamp = new Date(metrics.timestamp);

        if (Number.isNaN(timestamp.getTime())) {
            return reply.status(400).send({
                error: "Invalid metrics timestamp"
            });
        }

        try {
            await pool.execute(
                `INSERT INTO metrics (metric_timestamp, payload)
                 VALUES (?, ?)`,
                [
                    timestamp,
                    JSON.stringify(metrics)
                ]
            );

            return reply.status(201).send({
                success: true,
                message: "Metrics stored successfully."
            });
        } catch (error) {
            request.log.error(error, "Failed to store metrics");

            return reply.status(500).send({
                error: "Failed to store metrics"
            });
        }
    });

    app.get("/metrics", async (request, reply) => {
        try {
            const [rows] = await pool.query(
                `SELECT payload
                 FROM metrics
                 ORDER BY id DESC
                 LIMIT 1`
            );

            const latest = (rows as { payload: Metrics | string }[])[0];

            if (!latest) {
                return reply.status(404).send({
                    error: "No metrics received yet."
                });
            }

            const payload = typeof latest.payload === "string"
                ? JSON.parse(latest.payload)
                : latest.payload;

            return reply.send(payload);
        } catch (error) {
            request.log.error(error, "Failed to retrieve metrics");

            return reply.status(500).send({
                error: "Failed to retrieve metrics"
            });
        }
    });
}
