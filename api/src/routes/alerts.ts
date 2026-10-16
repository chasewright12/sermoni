import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireAdmin } from "../auth/hooks";
import { ALERT_METRICS } from "../alerts/types";
import * as alertRepository from "../repositories/alert.repository";
import { configuredChannels, sendNotification } from "../alerts/notifier";
import { getServerById } from "../servers/services/server.service";

const IdParamsSchema = z.object({
    id: z.coerce.number().int().positive()
});

const ListQuerySchema = z.object({
    status: z.enum(["firing", "resolved"]).optional(),
    serverId: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().min(1).max(200).default(50)
});

const CreateRuleSchema = z
    .object({
        serverId: z.number().int().positive().nullable().default(null),
        metric: z.enum(ALERT_METRICS),
        threshold: z.number().positive(),
        durationSeconds: z.number().int().min(0).max(86400).default(0),
        enabled: z.boolean().default(true)
    })
    .refine((rule) => rule.metric === "offline" || rule.threshold <= 100, {
        message: "threshold must be at most 100 for percentage metrics",
        path: ["threshold"]
    });

const UpdateRuleSchema = z.object({
    threshold: z.number().positive().optional(),
    durationSeconds: z.number().int().min(0).max(86400).optional(),
    enabled: z.boolean().optional()
});

export async function alertsRoutes(app: FastifyInstance) {
    // Envia uma notificação de teste para todos os canais configurados
    app.post(
        "/alerts/test",
        { onRequest: requireAdmin },
        async (request, reply) => {
            if (configuredChannels().length === 0) {
                return reply.status(400).send({
                    error: "No notification channel is configured"
                });
            }

            const results = await sendNotification(
                {
                    status: "firing",
                    hostname: "sermoni-test",
                    metric: "cpu",
                    value: 95,
                    threshold: 90,
                    durationSeconds: 300
                },
                request.log
            );

            return reply.send({ results });
        }
    );

    app.get("/alerts", async (request, reply) => {
        const query = ListQuerySchema.safeParse(request.query);

        if (!query.success) {
            return reply.status(400).send({
                error: "Invalid query params",
                details: query.error.issues
            });
        }

        try {
            const alerts = await alertRepository.listAlerts(query.data);

            return reply.send({ count: alerts.length, data: alerts });
        } catch (error) {
            request.log.error(error, "Failed to list alerts");

            return reply.status(500).send({ error: "Failed to list alerts" });
        }
    });

    app.get("/alert-rules", async (request, reply) => {
        try {
            const rules = await alertRepository.findAllRules();

            return reply.send({ count: rules.length, data: rules });
        } catch (error) {
            request.log.error(error, "Failed to list alert rules");

            return reply
                .status(500)
                .send({ error: "Failed to list alert rules" });
        }
    });

    app.post(
        "/alert-rules",
        { onRequest: requireAdmin },
        async (request, reply) => {
            const body = CreateRuleSchema.safeParse(request.body);

            if (!body.success) {
                return reply.status(400).send({
                    error: "Invalid alert rule",
                    details: body.error.issues
                });
            }

            const { serverId, metric, threshold, enabled } = body.data;
            const durationSeconds =
                metric === "offline" ? 0 : body.data.durationSeconds;

            try {
                if (serverId !== null && !(await getServerById(serverId))) {
                    return reply.status(404).send({ error: "Server not found" });
                }

                if (await alertRepository.findRuleByScope(serverId, metric)) {
                    return reply.status(409).send({
                        error: "A rule for this metric already exists in this scope"
                    });
                }

                const rule = await alertRepository.createRule({
                    serverId,
                    metric,
                    threshold,
                    durationSeconds,
                    enabled
                });

                return reply.status(201).send(rule);
            } catch (error) {
                request.log.error(error, "Failed to create alert rule");

                return reply
                    .status(500)
                    .send({ error: "Failed to create alert rule" });
            }
        }
    );

    app.patch(
        "/alert-rules/:id",
        { onRequest: requireAdmin },
        async (request, reply) => {
            const params = IdParamsSchema.safeParse(request.params);
            const body = UpdateRuleSchema.safeParse(request.body);

            if (!params.success || !body.success) {
                return reply.status(400).send({
                    error: "Invalid request",
                    details: [
                        ...(params.success ? [] : params.error.issues),
                        ...(body.success ? [] : body.error.issues)
                    ]
                });
            }

            try {
                const rule = await alertRepository.findRuleById(params.data.id);

                if (!rule) {
                    return reply.status(404).send({ error: "Rule not found" });
                }

                const threshold = body.data.threshold ?? rule.threshold;

                if (rule.metric !== "offline" && threshold > 100) {
                    return reply.status(400).send({
                        error: "threshold must be at most 100 for percentage metrics"
                    });
                }

                const updated = {
                    ...rule,
                    threshold,
                    duration_seconds:
                        rule.metric === "offline"
                            ? 0
                            : (body.data.durationSeconds ?? rule.duration_seconds),
                    enabled: body.data.enabled ?? rule.enabled
                };

                await alertRepository.updateRule(updated);

                return reply.send(updated);
            } catch (error) {
                request.log.error(error, "Failed to update alert rule");

                return reply
                    .status(500)
                    .send({ error: "Failed to update alert rule" });
            }
        }
    );
}