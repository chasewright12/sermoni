import type { FastifyBaseLogger } from "fastify";
import { evaluateRule } from "../alerts/evaluator";
import { sendNotification } from "../alerts/notifier";
import * as alertRepository from "../repositories/alert.repository";
import type { AlertMetric, AlertRule, MonitoredServer } from "../alerts/types";

export function effectiveRules(
    rules: AlertRule[],
    serverId: number
): AlertRule[] {
    const byMetric = new Map<AlertMetric, AlertRule>();

    for (const rule of rules) {
        if (rule.server_id === serverId) {
            byMetric.set(rule.metric, rule);
        } else if (rule.server_id === null && !byMetric.has(rule.metric)) {
            byMetric.set(rule.metric, rule);
        }
    }

    return [...byMetric.values()].filter((rule) => rule.enabled);
}

async function evaluateServer(
    server: MonitoredServer,
    rules: AlertRule[],
    now: number,
    log: FastifyBaseLogger
) {
    const effective = effectiveRules(rules, server.id);
    const effectiveIds = new Set(effective.map((rule) => rule.id));

    const thresholdRules = effective.filter((r) => r.metric !== "offline");
    const longestWindow = Math.max(
        0,
        ...thresholdRules.map((r) => r.duration_seconds)
    );

    const points =
        thresholdRules.length > 0
            ? await alertRepository.findRecentPoints(
                server.id,
                now - (longestWindow + 60) * 1000
            )
            : [];

    const lastSeen = server.last_seen
        ? new Date(server.last_seen).getTime()
        : null;

    const openAlerts = await alertRepository.findOpenAlertsByServer(server.id);

    for (const open of openAlerts) {
        if (open.rule_id === null || !effectiveIds.has(open.rule_id)) {
            await alertRepository.resolveAlert(open.id);
        }
    }

    for (const rule of effective) {
        const evaluation = evaluateRule(rule, points, lastSeen, now);
        const open = openAlerts.find((a) => a.rule_id === rule.id);

        const event = {
            hostname: server.hostname,
            metric: rule.metric,
            value: evaluation.value ?? 0,
            threshold: rule.threshold,
            durationSeconds: rule.duration_seconds
        };

        if (evaluation.breached && !open) {
            await alertRepository.createAlert({
                serverId: server.id,
                ruleId: rule.id,
                metric: rule.metric,
                value: event.value,
                threshold: rule.threshold
            });

            await sendNotification({ ...event, status: "firing" }, log);
        } else if (!evaluation.breached && open) {
            await alertRepository.resolveAlert(open.id);

            await sendNotification({ ...event, status: "resolved" }, log);
        }
    }
}

export async function evaluateAllServers(
    log: FastifyBaseLogger,
    now: number = Date.now()
) {
    const [servers, rules] = await Promise.all([
        alertRepository.findMonitoredServers(),
        alertRepository.findAllRules()
    ]);

    for (const server of servers) {
        try {
            await evaluateServer(server, rules, now, log);
        } catch (error) {
            log.error(error, `Failed to evaluate alerts for ${server.hostname}`);
        }
    }
}