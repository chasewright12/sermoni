
import {
    beforeEach,
    describe,
    expect,
    it,
    vi
} from "vitest";

import type { FastifyBaseLogger } from "fastify";
import type {
    AlertRule,
    MetricPoint,
    MonitoredServer,
    OpenAlert
} from "../src/alerts/types";

const mocks = vi.hoisted(() => ({
    findMonitoredServers: vi.fn(),
    findAllRules: vi.fn(),
    findRecentPoints: vi.fn(),
    findOpenAlertsByServer: vi.fn(),
    createAlert: vi.fn(),
    resolveAlert: vi.fn(),
    sendNotification: vi.fn()
}));

vi.mock("../src/repositories/alert.repository", () => ({
    findMonitoredServers: mocks.findMonitoredServers,
    findAllRules: mocks.findAllRules,
    findRecentPoints: mocks.findRecentPoints,
    findOpenAlertsByServer: mocks.findOpenAlertsByServer,
    createAlert: mocks.createAlert,
    resolveAlert: mocks.resolveAlert
}));

vi.mock("../src/alerts/notifier", () => ({
    sendNotification: mocks.sendNotification
}));

import { evaluateAllServers } from "../src/services/alert.service";

const NOW = Date.parse("2026-10-16T12:00:00Z");

const server: MonitoredServer = {
    id: 3,
    hostname: "rootmannwright",
    last_seen: new Date(NOW - 10_000)
};

const cpuRule: AlertRule = {
    id: 1,
    server_id: null,
    metric: "cpu",
    threshold: 80,
    duration_seconds: 0,
    enabled: true
};

function metricPoint(cpu: number): MetricPoint {
    return {
        timestamp: NOW - 5_000,
        cpu,
        memory: 50,
        disk: 50
    };
}

const logger = {
    error: vi.fn()
} as unknown as FastifyBaseLogger;

beforeEach(() => {
    vi.clearAllMocks();

    mocks.findMonitoredServers.mockResolvedValue([server]);
    mocks.findAllRules.mockResolvedValue([cpuRule]);
    mocks.findRecentPoints.mockResolvedValue([metricPoint(95)]);
    mocks.findOpenAlertsByServer.mockResolvedValue([]);
    mocks.createAlert.mockResolvedValue(undefined);
    mocks.resolveAlert.mockResolvedValue(undefined);
    mocks.sendNotification.mockResolvedValue([]);
});

describe("evaluateAllServers - alert lifecycle", () => {
    it("creates a firing alert and sends a notification when the threshold is breached", async () => {
        await evaluateAllServers(logger, NOW);

        expect(mocks.createAlert).toHaveBeenCalledWith({
            serverId: 3,
            ruleId: 1,
            metric: "cpu",
            value: 95,
            threshold: 80
        });

        expect(mocks.sendNotification).toHaveBeenCalledWith(
            {
                hostname: "rootmannwright",
                metric: "cpu",
                value: 95,
                threshold: 80,
                durationSeconds: 0,
                status: "firing"
            },
            logger
        );
    });

    it("resolves an open alert and sends a resolution notification when the metric recovers", async () => {
        const openAlert: OpenAlert = {
            id: 22,
            rule_id: 1
        };

        mocks.findOpenAlertsByServer.mockResolvedValue([openAlert]);
        mocks.findRecentPoints.mockResolvedValue([metricPoint(40)]);

        await evaluateAllServers(logger, NOW);

        expect(mocks.resolveAlert).toHaveBeenCalledWith(22);

        expect(mocks.sendNotification).toHaveBeenCalledWith(
            {
                hostname: "rootmannwright",
                metric: "cpu",
                value: 40,
                threshold: 80,
                durationSeconds: 0,
                status: "resolved"
            },
            logger
        );

        expect(mocks.createAlert).not.toHaveBeenCalled();
    });

    it("does not create duplicate alerts when an alert is already firing", async () => {
        const openAlert: OpenAlert = {
            id: 22,
            rule_id: 1
        };

        mocks.findOpenAlertsByServer.mockResolvedValue([openAlert]);

        await evaluateAllServers(logger, NOW);

        expect(mocks.createAlert).not.toHaveBeenCalled();
        expect(mocks.resolveAlert).not.toHaveBeenCalled();
        expect(mocks.sendNotification).not.toHaveBeenCalled();
    });
});
