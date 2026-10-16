import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireAdmin } from "../auth/hooks";
import { issueApiKey } from "../servers/services/server.service";

const ParamsSchema = z.object({
    id: z.coerce.number().int().positive()
});

export async function serverKeysRoutes(app: FastifyInstance) {
    app.post(
        "/servers/:id/api-key",
        { onRequest: requireAdmin },
        async (request, reply) => {
            const params = ParamsSchema.safeParse(request.params);

            if (!params.success) {
                return reply.status(400).send({
                    error: "Invalid server id",
                    details: params.error.issues
                });
            }

            try {
                const apiKey = await issueApiKey(params.data.id);

                if (!apiKey) {
                    return reply.status(404).send({
                        error: "Server not found"
                    });
                }

                reply.header("Cache-Control", "no-store");

                return reply.status(201).send({
                    serverId: params.data.id,
                    apiKey,
                    message:
                        "Store this key now. It cannot be retrieved again."
                });
            } catch (error) {
                request.log.error(error, "Failed to issue API key");

                return reply.status(500).send({
                    error: "Failed to issue API key"
                });
            }
        }
    );
}