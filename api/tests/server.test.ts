import { describe, expect, it } from "vitest";
import { app } from "../src/server";

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
        const metrics = {
            system: {
                hostname: "test-server",

                operatingSystem: {
                    platform: "linux",
                    distro: "ubuntu",
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

        const response = await app.inject({
            method: "POST",
            url: "/metrics",
            headers: {
                "content-type": "application/json"
            },
            payload: JSON.stringify(metrics)
        });
        
        expect(response.statusCode).toBe(201);

        expect(response.json()).toEqual({
            success: true,
            message: "Metrics received successfully."
        });
    });

    it("should reject invalid metrics", async () => {
        const invalidMetrics = {
            system: {
                hostname: "test-server"
            }
        };

        const response = await app.inject({
            method: "POST",
            url: "/metrics",
            headers: {
                "content-type": "application/json"
            },
            payload: JSON.stringify(invalidMetrics)
        });

        expect(response.statusCode).toBe(400);

        expect(response.json()).toHaveProperty("error", "Invalid metrics");
    });

    describe("GET /metrics", () => {
        it("should return stored metrics", async () => {
            const metrics = {
                system: {
                    hostname: "test-server",

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

            const postResponse = await app.inject({
                method: "POST",
                url: "/metrics",
                headers: {
                    "content-type": "application/json"
                },
                payload: JSON.stringify(metrics)
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
});
