import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../db";
import type {
    AlertMetric,
    AlertRecord,
    AlertRule,
    AlertStatus,
    MetricPoint,
    MonitoredServer,
    OpenAlert
} from "../alerts/types";

interface RuleRow extends RowDataPacket {
    id: number;
    server_id: number | null;
    metric: AlertMetric;
    threshold: number;
    duration_seconds: number;
    enabled: number;
}

interface AlertRow extends RowDataPacket, AlertRecord { }

interface ServerRow extends RowDataPacket, MonitoredServer { }

interface MetricRow extends RowDataPacket {
    metric_timestamp: Date;
    payload: unknown;
}

const toRule = (row: RuleRow): AlertRule => ({
    id: row.id,
    server_id: row.server_id,
    metric: row.metric,
    threshold: row.threshold,
    duration_seconds: row.duration_seconds,
    enabled: row.enabled === 1
});

const ruleColumns = `id, server_id, metric, threshold, duration_seconds, enabled`;

export async function findAllRules(): Promise<AlertRule[]> {
    const [rows] = await pool.execute<RuleRow[]>(
        `SELECT ${ruleColumns} FROM alert_rules ORDER BY id`
    );

    return rows.map(toRule);
}

export async function findRuleById(id: number): Promise<AlertRule | null> {
    const [rows] = await pool.execute<RuleRow[]>(
        `SELECT ${ruleColumns} FROM alert_rules WHERE id = ? LIMIT 1`,
        [id]
    );

    const row = rows[0];
    return row ? toRule(row) : null;
}

export async function findRuleByScope(
    serverId: number | null,
    metric: AlertMetric
): Promise<AlertRule | null> {
    const [rows] =
        serverId === null
            ? await pool.execute<RuleRow[]>(
                `SELECT ${ruleColumns} FROM alert_rules
                   WHERE server_id IS NULL AND metric = ? LIMIT 1`,
                [metric]
            )
            : await pool.execute<RuleRow[]>(
                `SELECT ${ruleColumns} FROM alert_rules
                   WHERE server_id = ? AND metric = ? LIMIT 1`,
                [serverId, metric]
            );

    const row = rows[0];
    return row ? toRule(row) : null;
}

export async function createRule(data: {
    serverId: number | null;
    metric: AlertMetric;
    threshold: number;
    durationSeconds: number;
    enabled: boolean;
}): Promise<AlertRule> {
    const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO alert_rules
            (server_id, metric, threshold, duration_seconds, enabled)
         VALUES (?, ?, ?, ?, ?)`,
        [
            data.serverId,
            data.metric,
            data.threshold,
            data.durationSeconds,
            data.enabled ? 1 : 0
        ]
    );

    const rule = await findRuleById(result.insertId);

    if (!rule) {
        throw new Error("Rule was created but could not be retrieved");
    }

    return rule;
}

export async function updateRule(rule: AlertRule): Promise<void> {
    await pool.execute(
        `UPDATE alert_rules
         SET threshold = ?, duration_seconds = ?, enabled = ?
         WHERE id = ?`,
        [rule.threshold, rule.duration_seconds, rule.enabled ? 1 : 0, rule.id]
    );
}

export async function findMonitoredServers(): Promise<MonitoredServer[]> {
    const [rows] = await pool.execute<ServerRow[]>(
        `SELECT id, hostname, last_seen FROM servers`
    );

    return rows;
}

export async function findRecentPoints(
    serverId: number,
    since: number
): Promise<MetricPoint[]> {
    const [rows] = await pool.execute<MetricRow[]>(
        `SELECT metric_timestamp, payload
         FROM metrics
         WHERE server_id = ? AND metric_timestamp >= ?
         ORDER BY metric_timestamp ASC
         LIMIT ?`,
        [serverId, new Date(since), 2000]
    );

    const points: MetricPoint[] = [];

    for (const row of rows) {
        const payload = (
            typeof row.payload === "string"
                ? JSON.parse(row.payload)
                : row.payload
        ) as {
            cpu?: number;
            memory?: { percentage?: number };
            disk?: { size: number; percentage: number }[];
        };

        const mainDisk = (payload.disk ?? []).reduce<
            { size: number; percentage: number } | undefined
        >((best, d) => (!best || d.size > best.size ? d : best), undefined);

        points.push({
            timestamp: new Date(row.metric_timestamp).getTime(),
            cpu: payload.cpu ?? 0,
            memory: payload.memory?.percentage ?? 0,
            disk: mainDisk?.percentage ?? 0
        });
    }

    return points;
}

export async function findOpenAlertsByServer(
    serverId: number
): Promise<OpenAlert[]> {
    const [rows] = await pool.execute<(RowDataPacket & OpenAlert)[]>(
        `SELECT id, rule_id FROM alerts
         WHERE server_id = ? AND status = 'firing'`,
        [serverId]
    );

    return rows;
}

export async function createAlert(data: {
    serverId: number;
    ruleId: number;
    metric: AlertMetric;
    value: number;
    threshold: number;
}): Promise<void> {
    await pool.execute(
        `INSERT INTO alerts (server_id, rule_id, metric, status, value, threshold)
         VALUES (?, ?, ?, 'firing', ?, ?)`,
        [data.serverId, data.ruleId, data.metric, data.value, data.threshold]
    );
}

export async function resolveAlert(id: number): Promise<void> {
    await pool.execute(
        `UPDATE alerts
         SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [id]
    );
}

export async function listAlerts(filters: {
    status?: AlertStatus;
    serverId?: number;
    limit: number;
}): Promise<AlertRecord[]> {
    const conditions: string[] = [];
    const parameters: (string | number)[] = [];

    if (filters.status) {
        conditions.push("a.status = ?");
        parameters.push(filters.status);
    }

    if (filters.serverId !== undefined) {
        conditions.push("a.server_id = ?");
        parameters.push(filters.serverId);
    }

    const where =
        conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    parameters.push(filters.limit);

    const [rows] = await pool.execute<AlertRow[]>(
        `SELECT a.id, a.server_id, s.hostname, a.rule_id, a.metric,
                a.status, a.value, a.threshold, a.started_at, a.resolved_at
         FROM alerts a
         JOIN servers s ON s.id = a.server_id
         ${where}
         ORDER BY a.started_at DESC, a.id DESC
         LIMIT ?`,
        parameters
    );

    return rows;
}