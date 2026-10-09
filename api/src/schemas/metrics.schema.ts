import { z } from "zod";

export const MetricsSchema = z.object({
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

export type Metrics = z.infer<typeof MetricsSchema>;