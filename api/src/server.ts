import Fastify from "fastify";
import { z } from "zod";

const app = Fastify({
    logger: true
});

const MetricsSchema = z.object({
    system: z.object({
        hostname: z.string(),

        operatingSystem: z.object({
            platform: z.string(),
            distro: z.string(),
            release: z.string(),
            arch: z.string()
        }),

        hardware: z.object({
            manufacturer: z.string(),
            model: z.string()
        }),

        uptime: z.number(),

        cpu: z.object({
            cores: z.number()
        })
    }),

    cpu: z.number(),

    memory: z.object({
        total: z.number(),
        used: z.number(),
        free: z.number(),
        percentage: z.number()
    }),

    disk: z.array(
        z.object({
            filesystem: z.string(),
            size: z.number(),
            used: z.number(),
            percentage: z.number()
        })
    ),

    timestamp: z.string()
});

type Metrics = z.infer<typeof MetricsSchema>;

let latestMetrics: Metrics | null = null;

app.post("/metrics", async (request, reply) => {
    const result = MetricsSchema.safeParse(request.body);

    if (!result.success) {
        return reply.status(400).send({
            error: "Invalid metrics",
            details: result.error.issues
        });
    }

    const metrics = result.data;

    latestMetrics = metrics;

    console.log("Metrics received:");
    console.dir(metrics, { depth: null});

    return reply.status(201).send({
        success: true,
        message: "Metrics received successfully."
    });
});

app.get("/metrics", async (_request, reply) => {
    if (!latestMetrics) {
        return reply.status(404).send({
            error: "No metrics received yet"
        });
    }

    return latestMetrics;
});

app.get("/health", async () => {
    return {
        status: "ok"
    };
});

export { app };

const start = async () => {
    try {
        await app.listen({
            port: 3000,
            host: "0.0.0.0"
        });

        console.log("Monitoring API running on port 3000.");
    } catch (error) {
        app.log.error(error);
        process.exit(1);
    }
};

if (import.meta.url === `file://${process.argv[1]}`) {
    start();
}