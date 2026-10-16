export const ALERT_METRICS = ["cpu", "memory", "disk", "offline"] as const;

export type AlertMetric = (typeof ALERT_METRICS)[number];

export type AlertStatus = "firing" | "resolved";


export interface AlertRule {
    id: number;
    server_id: number | null;
    metric: AlertMetric;
    threshold: number;
    duration_seconds: number;
    enabled: boolean;
}

export interface AlertRecord {
    id: number;
    server_id: number;
    hostname: string;
    rule_id: number | null;
    metric: AlertMetric;
    status: AlertStatus;
    value: number;
    threshold: number;
    started_at: Date;
    resolved_at: Date | null;
}

export interface OpenAlert {
    id: number;
    rule_id: number | null;
}

export interface MonitoredServer {
    id: number;
    hostname: string;
    last_seen: Date | null;
}

export interface MetricPoint {
    timestamp: number;
    cpu: number;
    memory: number;
    disk: number;
}