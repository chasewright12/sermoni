
import { describe, expect, it } from "vitest";
import { evaluateRule } from "../src/alerts/evaluator";
import type { AlertRule, MetricPoint } from "../src/alerts/types";

const NOW = Date.parse("2026-10-16T12:00:00Z");
const SECOND = 1_000;
const MINUTE = 60 * SECOND;

function rule(overrides: Partial<AlertRule> = {}): AlertRule {
    return {
        id: 1,
        server_id: null,
        metric: "cpu",
        threshold: 90,
        duration_seconds: 300,
        enabled: true,
        ...overrides
    };
}

function point(
    timestamp: number,
    values: Partial<Omit<MetricPoint, "timestamp">> = {}
): MetricPoint {
    return {
        timestamp,
        cpu: 0,
        memory: 0,
        disk: 0,
        ...values
    };
}

function series(values: number[], endAt = NOW): MetricPoint[] {
    return values.map((cpu, index) =>
        point(
            endAt - (values.length - 1 - index) * 10 * SECOND,
            { cpu }
        )
    );
}

describe("evaluateRule - CPU threshold", () => {
    it("fires when every reading in the window exceeds the threshold", () => {
        const points = series(Array(31).fill(95));

        expect(evaluateRule(rule(), points, NOW, NOW)).toEqual({
            breached: true,
            value: 95
        });
    });

    it("does not fire when one reading in the window is below the threshold", () => {
        const values = Array<number>(31).fill(95);
        values[10] = 40;

        const result = evaluateRule(
            rule(),
            series(values),
            NOW,
            NOW
        );

        expect(result.breached).toBe(false);
        expect(result.value).toBe(95);
    });

    it("does not fire when readings do not cover the required window", () => {
        const points = series(Array(7).fill(95));

        const result = evaluateRule(rule(), points, NOW, NOW);

        expect(result.breached).toBe(false);
        expect(result.value).toBe(95);
    });

    it("accepts readings starting exactly within the coverage tolerance", () => {
        // The first reading is 30 seconds after the start of the 300-second window.
        const points = series(Array(28).fill(95));

        expect(evaluateRule(rule(), points, NOW, NOW)).toEqual({
            breached: true,
            value: 95
        });
    });

    it("does not fire when readings start outside the coverage tolerance", () => {
        // 27 readings span only 260 seconds of a 300-second window.
        const points = series(Array(27).fill(95));

        const result = evaluateRule(rule(), points, NOW, NOW);

        expect(result.breached).toBe(false);
        expect(result.value).toBe(95);
    });

    it("does not fire on stale data", () => {
        const points = series(
            Array(31).fill(95),
            NOW - 5 * MINUTE
        );

        const result = evaluateRule(rule(), points, NOW, NOW);

        expect(result).toEqual({
            breached: false,
            value: 95
        });
    });

    it("evaluates only the latest reading when duration is zero", () => {
        const points = series([20, 20, 95]);

        const result = evaluateRule(
            rule({ duration_seconds: 0 }),
            points,
            NOW,
            NOW
        );

        expect(result).toEqual({
            breached: true,
            value: 95
        });
    });

    it("does not fire when the latest reading is below the threshold with zero duration", () => {
        const points = series([95, 95, 20]);

        const result = evaluateRule(
            rule({ duration_seconds: 0 }),
            points,
            NOW,
            NOW
        );

        expect(result).toEqual({
            breached: false,
            value: 20
        });
    });

    it("does not fire when the reading equals the threshold", () => {
        const points = [
            point(NOW, { cpu: 90 })
        ];

        const result = evaluateRule(
            rule({ duration_seconds: 0 }),
            points,
            NOW,
            NOW
        );

        expect(result).toEqual({
            breached: false,
            value: 90
        });
    });

    it("does not fire when there are no readings", () => {
        expect(
            evaluateRule(rule(), [], NOW, NOW)
        ).toEqual({
            breached: false,
            value: null
        });
    });
});

describe("evaluateRule - memory threshold", () => {
    it("fires when memory exceeds the threshold", () => {
        const memoryRule = rule({
            metric: "memory",
            threshold: 80,
            duration_seconds: 0
        });

        const points = [
            point(NOW, { memory: 85 })
        ];

        expect(
            evaluateRule(memoryRule, points, NOW, NOW)
        ).toEqual({
            breached: true,
            value: 85
        });
    });

    it("does not fire when memory is below the threshold", () => {
        const memoryRule = rule({
            metric: "memory",
            threshold: 80,
            duration_seconds: 0
        });

        const points = [
            point(NOW, { memory: 75 })
        ];

        expect(
            evaluateRule(memoryRule, points, NOW, NOW)
        ).toEqual({
            breached: false,
            value: 75
        });
    });
});

describe("evaluateRule - disk threshold", () => {
    it("fires when disk usage exceeds the threshold", () => {
        const diskRule = rule({
            metric: "disk",
            threshold: 90,
            duration_seconds: 0
        });

        const points = [
            point(NOW, { disk: 95 })
        ];

        expect(
            evaluateRule(diskRule, points, NOW, NOW)
        ).toEqual({
            breached: true,
            value: 95
        });
    });

    it("does not fire when disk usage equals the threshold", () => {
        const diskRule = rule({
            metric: "disk",
            threshold: 90,
            duration_seconds: 0
        });

        const points = [
            point(NOW, { disk: 90 })
        ];

        expect(
            evaluateRule(diskRule, points, NOW, NOW)
        ).toEqual({
            breached: false,
            value: 90
        });
    });
});

describe("evaluateRule - offline", () => {
    const offlineRule = rule({
        metric: "offline",
        threshold: 120,
        duration_seconds: 0
    });

    it("fires when the server has been silent longer than the threshold", () => {
        const result = evaluateRule(
            offlineRule,
            [],
            NOW - 300 * SECOND,
            NOW
        );

        expect(result).toEqual({
            breached: true,
            value: 300
        });
    });

    it("does not fire when the silence duration is below the threshold", () => {
        const result = evaluateRule(
            offlineRule,
            [],
            NOW - 30 * SECOND,
            NOW
        );

        expect(result).toEqual({
            breached: false,
            value: 30
        });
    });

    it("does not fire when silence duration equals the threshold", () => {
        const result = evaluateRule(
            offlineRule,
            [],
            NOW - 120 * SECOND,
            NOW
        );

        expect(result).toEqual({
            breached: false,
            value: 120
        });
    });

    it("does not fire when the server has never sent metrics", () => {
        expect(
            evaluateRule(offlineRule, [], null, NOW)
        ).toEqual({
            breached: false,
            value: null
        });
    });
});
