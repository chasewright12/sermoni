
import { afterAll, describe, expect, it } from "vitest";
import { app } from "../src/server";

function agentHeaders() {
    const apiKey = process.env.SERMONI_API_KEY;

    if (!apiKey) {
        throw new Error(
            "SERMONI_API_KEY must be configured for metrics integration tests"
        );
    }

    return {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`
    };
}

function createMetrics(hostname = "test-server") {
    return {
        system: {
            hostname,
            operatingSystem: {
                platform: "linux",
                distro: "Ubuntu",
                release: "24.04",
                arch: "x64"
            },
            hardware: {
                manufacturer: "Microsoft",
                model: "WSL"
            },
            uptime: 12345,
            cpu: {
                cores: 8
            }
        },
        cpu: 35.5,
        memory: {
            total: 4000000000,
            used: 2000000000,
            free: 2000000000,
            percentage: 50
        },
        disk: [
            {
                filesystem: "/",
                size: 100000000000,
                used: 50000000000,
                percentage: 50
            }
        ],
        timestamp: new Date().toISOString()
    };
}

async function postMetrics(hostname = "test-server") {
    return app.inject({
        method: "POST",
        url: "/metrics",
        headers: agentHeaders(),
        payload: JSON.stringify(createMetrics(hostname))
    });
}

describe("GET /health", () => {
    it("should return API status", async () => {
        const response = await app.inject({
            method: "GET",
            url: "/health"
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({
            status: "ok"
        });
    });
});

describe("POST /metrics", () => {
    it("should accept valid metrics", async () => {
        const response = await postMetrics();

        expect(response.statusCode).toBe(201);

        const body = response.json();

        expect(body).toMatchObject({
            success: true,
            message: "Metrics stored successfully."
        });

        expect(body.serverId).toBeTypeOf("number");
    });

    it("should reject invalid metrics", async () => {
        const response = await app.inject({
            method: "POST",
            url: "/metrics",
            headers: agentHeaders(),
            payload: {
                system: {
                    hostname: "test-server"
                }
            }
        });

        expect(response.statusCode).toBe(400);
        expect(response.json()).toHaveProperty(
            "error",
            "Invalid metrics"
        );
    });
});

describe("GET /metrics", () => {
    it("should return stored metrics", async () => {
        const metrics = createMetrics("latest-metrics-test");

        const postResponse = await app.inject({
            method: "POST",
            url: "/metrics",
            headers: agentHeaders(),
            payload: metrics
        });

        expect(postResponse.statusCode).toBe(201);

        const getResponse = await app.inject({
            method: "GET",
            url: "/metrics"
        });

        expect(getResponse.statusCode).toBe(200);
        expect(getResponse.json()).toEqual(metrics);
    });
});

describe("GET /metrics/history", () => {
    it("should return historical metrics with the default limit", async () => {
        const response = await app.inject({
            method: "GET",
            url: "/metrics/history"
        });

        expect(response.statusCode).toBe(200);

        const body = response.json();

        expect(body).toHaveProperty("count");
        expect(body).toHaveProperty("limit", 50);
        expect(body).toHaveProperty("data");
        expect(Array.isArray(body.data)).toBe(true);
    });

    it("should respect a custom limit", async () => {
        const response = await app.inject({
            method: "GET",
            url: "/metrics/history?limit=1"
        });

        expect(response.statusCode).toBe(200);

        const body = response.json();

        expect(body.limit).toBe(1);
        expect(body.data.length).toBeLessThanOrEqual(1);
    });

    it("should return an empty array when no records match", async () => {
        const response = await app.inject({
            method: "GET",
            url:
                "/metrics/history" +
                "?from=2099-01-01T00:00:00.000Z" +
                "&to=2100-01-01T00:00:00.000Z"
        });

        expect(response.statusCode).toBe(200);
        expect(response.json().data).toEqual([]);
    });

    it("should reject an invalid from date", async () => {
        const response = await app.inject({
            method: "GET",
            url: "/metrics/history?from=invalid-date"
        });

        expect(response.statusCode).toBe(400);
    });

    it("should reject an invalid to date", async () => {
        const response = await app.inject({
            method: "GET",
            url: "/metrics/history?to=invalid-date"
        });

        expect(response.statusCode).toBe(400);
    });

    it("should reject a range where from is later than to", async () => {
        const response = await app.inject({
            method: "GET",
            url:
                "/metrics/history" +
                "?from=2026-10-13T12:00:00.000Z" +
                "&to=2026-10-12T12:00:00.000Z"
        });

        expect(response.statusCode).toBe(400);
    });

    it("should reject a limit that exceeds the allowed maximum", async () => {
        const response = await app.inject({
            method: "GET",
            url: "/metrics/history?limit=201"
        });

        // This assertion assumes the schema rejects limits above 200.
        expect(response.statusCode).toBe(400);
    });

    it("should return records with the expected structure", async () => {
        const hostname = `history-test-${Date.now()}`;
        const metrics = createMetrics(hostname);

        const postResponse = await app.inject({
            method: "POST",
            url: "/metrics",
            headers: agentHeaders(),
            payload: metrics
        });

        expect(postResponse.statusCode).toBe(201);

        const timestamp = new Date(metrics.timestamp);
        const from = new Date(
            timestamp.getTime() - 60_000
        ).toISOString();
        const to = new Date(
            timestamp.getTime() + 60_000
        ).toISOString();

        const response = await app.inject({
            method: "GET",
            url:
                `/metrics/history?from=${encodeURIComponent(from)}` +
                `&to=${encodeURIComponent(to)}`
        });

        expect(response.statusCode).toBe(200);

        const body = response.json();

        const record = body.data.find(
            (item: {
                payload: {
                    system: {
                        hostname: string;
                    };
                };
            }) => item.payload.system.hostname === hostname
        );

        expect(record).toBeDefined();
        expect(record).toHaveProperty("id");
        expect(record).toHaveProperty("metric_timestamp");
        expect(record).toHaveProperty("created_at");
        expect(record.payload).toMatchObject({
            system: {
                hostname
            },
            cpu: 35.5
        });
    });
});

afterAll(async () => {
    await app.close();
});
