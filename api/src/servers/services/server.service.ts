import * as serverRepository from "../repositories/server.repository";
import type { CreateServerData } from "../types/server.types";

export async function registerServer(
    data: CreateServerData
) {
    const existingServers = await serverRepository.findAllServers();

    const existing = existingServers.find(
        (server) =>
            server.hostname.toLowerCase() ===
            data.hostname.toLowerCase()
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