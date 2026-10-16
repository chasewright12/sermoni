import * as serverRepository from "../repositories/server.repository";
import type { CreateServerData } from "../types/server.types";
import type { Metrics } from "../../schemas/metrics.schema";

export async function registerServer(
    data: CreateServerData
) {
    const existing = (await serverRepository.findAllServers()).find(
        (server) => server.hostname === data.hostname
    );

    if (existing) {
        throw new Error("SERVER_ALREADY_EXISTS");
    }

    return serverRepository.createServer(data);
}

export async function getServerById(id: number) {
    return serverRepository.findServerById(id);
}

export async function getServers() {
    return serverRepository.findAllServers();
}

function isDuplicateEntry(error: unknown): boolean {
    return (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "ER_DUP_ENTRY"
    );
}

export async function resolveServerFromMetrics(metrics: Metrics) {
    const { hostname, operatingSystem } = metrics.system;

    let server = (await serverRepository.findAllServers()).find(
        (candidate) => candidate.hostname === hostname
    );

    if (!server) {
        try {
            server = await serverRepository.createServer({
                hostname,
                operatingSystem: `${operatingSystem.distro} ${operatingSystem.release}`,
                agentVersion: "unknown"
            });
        } catch (error) {
            if (!isDuplicateEntry(error)) {
                throw error;
            }

            server = (await serverRepository.findAllServers()).find(
                (candidate) => candidate.hostname === hostname
            );

            if (!server) {
                throw error;
            }
        }
    }

    await serverRepository.updateLastSeen(server.id);

    return server;
}