import { z } from "zod";

export const CreateServerSchema = z.object({
    hostname: z.string().trim().min(1).max(255),
    operatingSystem: z.string().trim().min(1).max(100),
    agentVersion: z.string().trim().min(1).max(50)
});

export type CreateServerInput = z.infer<
    typeof CreateServerSchema
    >;

export const ServerIdSchema = z.object({
    id: z.coerce.number().int().positive()
});