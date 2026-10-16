import { createHash, timingSafeEqual } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import { authenticateAgentKey } from "../servers/services/server.service";
import type { Server } from "../servers/types/server.types";

declare module "fastify" {
    interface FastifyRequest {
        agentServer?: Server;
    }
}

function extractBearerToken(header: string | undefined): string | null {
    if (!header) {
        return null;
    }

    const [scheme, token] = header.split(" ");

    if (scheme?.toLowerCase() !== "bearer" || !token) {
        return null;
    }

    return token;
}

function safeEqual(a: string, b: string): boolean {
    const left = createHash("sha256").update(a).digest();
    const right = createHash("sha256").update(b).digest();

    return timingSafeEqual(left, right);
}

export async function requireAgent(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const token = extractBearerToken(request.headers.authorization);
    const server = token ? await authenticateAgentKey(token) : null;

    if (!server) {
        return reply.status(401).send({
            error: "Invalid or missing API key"
        });
    }

    request.agentServer = server;
}

export async function requireAdmin(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const expected = process.env.ADMIN_TOKEN;

    if (!expected) {
        return reply.status(503).send({
            error: "Admin access is not configured"
        });
    }

    const token = extractBearerToken(request.headers.authorization);

    if (!token || !safeEqual(token, expected)) {
        return reply.status(401).send({
            error: "Invalid or missing admin token"
        });
    }
}