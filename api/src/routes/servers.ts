
import type { FastifyInstance } from "fastify";
import {
    CreateServerSchema,
    ServerIdSchema
} from "../servers/schemas/server.schema";
import * as serverService from "../servers/services/server.service";

export async function serversRoutes(app: FastifyInstance) {
    app.post("/servers", async (request, reply) => {
        const result = CreateServerSchema.safeParse(request.body);

        if (!result.success) {
            return reply.status(400).send({
                error: "Invalid server data",
                details: result.error.issues
            });
        }

        try {
            const server = await serverService.registerServer(
                result.data
            );

            return reply.status(201).send(server);
        } catch (error) {
            if (
                error instanceof Error &&
                error.message === "SERVER_ALREADY_EXISTS"
            ) {
                return reply.status(409).send({
                    error: "A server with this hostname already exists"
                });
            }

            request.log.error(error, "Failed to register server");

            return reply.status(500).send({
                error: "Failed to register server"
            });
        }
    });

    app.get("/servers", async (request, reply) => {
        try {
            const servers = await serverService.getServers();

            return reply.send({
                count: servers.length,
                data: servers
            });
        } catch (error) {
            request.log.error(error, "Failed to retrieve servers");

            return reply.status(500).send({
                error: "Failed to retrieve servers"
            });
        }
    });

    app.get("/servers/:id", async (request, reply) => {
        const result = ServerIdSchema.safeParse(request.params);

        if (!result.success) {
            return reply.status(400).send({
                error: "Invalid server ID"
            });
        }

        try {
            const server = await serverService.getServerById(
                result.data.id
            );

            if (!server) {
                return reply.status(404).send({
                    error: "Server not found"
                });
            }

            return reply.send(server);
        } catch (error) {
            request.log.error(error, "Failed to retrieve server");

            return reply.status(500).send({
                error: "Failed to retrieve server"
            });
        }
    });
}
