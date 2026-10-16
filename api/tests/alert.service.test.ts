
import { describe, expect, it } from "vitest";
import { effectiveRules } from "../src/services/alert.service";
import type {
    AlertMetric,
    AlertRule
} from "../src/alerts/types";

function makeRule(
    id: number,
    metric: AlertMetric,
    server_id: number | null,
    enabled = true
): AlertRule {
    return {
        id,
        server_id,
        metric,
        threshold: metric === "offline" ? 60 : 80,
        duration_seconds: metric === "offline" ? 0 : 60,
        enabled
    };
}

describe("effectiveRules", () => {
    it("uses global rules when no server-specific rule exists", () => {
        const cpu = makeRule(1, "cpu", null);
        const memory = makeRule(2, "memory", null);
        const anotherServer = makeRule(3, "disk", 99);

        expect(
            effectiveRules([cpu, memory, anotherServer], 3)
        ).toEqual([cpu, memory]);
    });

    it("prefers a server-specific rule over a global rule", () => {
        const globalCpu = makeRule(1, "cpu", null);
        const serverCpu = makeRule(2, "cpu", 3);

        expect(
            effectiveRules([globalCpu, serverCpu], 3)
        ).toEqual([serverCpu]);

        expect(
            effectiveRules([serverCpu, globalCpu], 3)
        ).toEqual([serverCpu]);
    });

    it("ignores rules belonging to another server", () => {
        const otherServerCpu = makeRule(1, "cpu", 99);
        const globalMemory = makeRule(2, "memory", null);

        expect(
            effectiveRules([otherServerCpu, globalMemory], 3)
        ).toEqual([globalMemory]);
    });

    it("excludes disabled global rules", () => {
        const disabledCpu = makeRule(1, "cpu", null, false);
        const enabledMemory = makeRule(2, "memory", null);

        expect(
            effectiveRules([disabledCpu, enabledMemory], 3)
        ).toEqual([enabledMemory]);
    });

    it("does not fall back to a global rule when a specific rule is disabled", () => {
        const globalCpu = makeRule(1, "cpu", null);
        const disabledServerCpu = makeRule(2, "cpu", 3, false);

        expect(
            effectiveRules([globalCpu, disabledServerCpu], 3)
        ).toEqual([]);
    });

    it("returns no rules when no applicable rules exist", () => {
        const anotherServer = makeRule(1, "cpu", 99);

        expect(
            effectiveRules([anotherServer], 3)
        ).toEqual([]);
    });
});
