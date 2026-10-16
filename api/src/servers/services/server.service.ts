import * as serverRepository from "../repositories/server.repository";
import type { CreateServerData } from "../types/server.types";
import { generateApiKey, hashApiKey } from "../../auth/api-key";

export async function registerServer(
    data: CreateServerData
) {
    const existing = await serverRepository.findServerByHostname(
        data.hostname
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

export async function authenticateAgentKey(rawKey: string) {
    return serverRepository.findServerByApiKeyHash(hashApiKey(rawKey));
}

export async function issueApiKey(serverId: number): Promise<string | null> {
    const server = await serverRepository.findServerById(serverId);

    if (!server) {
        return null;
    }

    const apiKey = generateApiKey();
    await serverRepository.setApiKeyHash(serverId, hashApiKey(apiKey));

    return apiKey;
}

export async function markServerSeen(id: number) {
    await serverRepository.updateLastSeen(id);
}