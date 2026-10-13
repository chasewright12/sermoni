import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
    MetricsSchema,
    type Metrics
} from "../schemas/metrics.schema";
import { pool } from "../db";

const HistoryQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(200).default(50),
    from: z.string().datetime({ offset: true }).optional(),
    to: z.string().datetime({ offset: true }).optional()
});

type HistoryRow = {
    id: number;
    metric_timestamp: Date | string;
    created_at: Date | string;
    payload: Metrics | string;
};

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
                `INSERT INTO metrics (metric_timestamp, payload) VALUES (?, ?)`,
                [timestamp, JSON.stringify(metrics)]
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

    app.get("/metrics/history", async (request, reply) => {
        const result = HistoryQuerySchema.safeParse(request.query);

        if (!result.success) {
            return reply.status(400).send({
                error: "Invalid query params",
                details: result.error.issues
            });
        }

        const { limit, from, to } = result.data;

        if (from && to && new Date(from) > new Date(to)) {
            return reply.status(400).send({
                error: "'from' must be earlier than or equal to 'to'"
            });
        }

        const conditions: string[] = [];
        const parameters: (Date | number)[] = [];

        if (from) {
            conditions.push("metric_timestamp >= ?");
            parameters.push(new Date(from));
        }

        if (to) {
            conditions.push("metric_timestamp <= ?");
            parameters.push(new Date(to));
        }

        let sql = `
            SELECT id, metric_timestamp, created_at, payload
            FROM metrics
            `;

        if (conditions.length > 0) {
            sql += ` WHERE ${conditions.join(" AND ")}`;
        }

        sql += " ORDER BY metric_timestamp DESC, id DESC LIMIT ?";
        parameters.push(limit);

        try {
            const [rows] = await pool.execute(sql, parameters);
            const history = (rows as HistoryRow[]).map((row) => ({
                ...row,
                payload:
                    typeof row.payload === "string"
                        ? JSON.parse(row.payload)
                        : row.payload
            }));

            return reply.send({
                count: history.length,
                limit,
                data: history
            });
        } catch (error) {
            request.log.error(error, "Failed to retrieve metric history");

            return reply.status(500).send({
                error: "Failed to retrieve metric history"
            });
        }
    });

    app.get("/metrics", async (request, reply) => {
        try {
            const [rows] = await pool.execute(
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

            const payload =
                typeof latest.payload === "string"
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