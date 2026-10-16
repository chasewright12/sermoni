import type { AlertRule, MetricPoint } from "./types";

const FRESH_MS = 60_000;
const COVERAGE_TOLERANCE_MS = 30_000;

export interface Evaluation {
    breached: boolean;
    value: number | null;
}

function evaluateOffline(
    rule: AlertRule,
    lastSeenMs: number | null,
    now: number
): Evaluation {
    if (lastSeenMs === null) {
        return { breached: false, value: null };
    }

    const secondsSilent = (now - lastSeenMs) / 1000;

    return {
        breached: secondsSilent > rule.threshold,
        value: secondsSilent
    };
}

function evaluateThreshold(
    rule: AlertRule,
    points: MetricPoint[],
    now: number
): Evaluation {
    if (rule.metric === "offline") {
        return { breached: false, value: null };
    }

    const key = rule.metric;
    const latest = points.at(-1);

    if (!latest) {
        return { breached: false, value: null };
    }

    if (now - latest.timestamp > FRESH_MS) {
        return { breached: false, value: latest[key] };
    }

    if (rule.duration_seconds === 0) {
        return { breached: latest[key] > rule.threshold, value: latest[key] };
    }

    const windowStart = now - rule.duration_seconds * 1000;
    const inWindow = points.filter((p) => p.timestamp >= windowStart);
    const first = inWindow[0];

    const coversWindow =
        inWindow.length >= 2 &&
        first !== undefined &&
        first.timestamp - windowStart <= COVERAGE_TOLERANCE_MS;

    const sustained =
        coversWindow && inWindow.every((p) => p[key] > rule.threshold);

    return { breached: sustained, value: latest[key] };
}

export function evaluateRule(
    rule: AlertRule,
    points: MetricPoint[],
    lastSeenMs: number | null,
    now: number
): Evaluation {
    if (rule.metric === "offline") {
        return evaluateOffline(rule, lastSeenMs, now);
    }

    return evaluateThreshold(rule, points, now);
}