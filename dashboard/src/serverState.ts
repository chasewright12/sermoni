import type { Server } from "./types";

export type ServerState = "online" | "offline" | "never";

export const SERVER_STATE_LABEL: Record<ServerState, string> = {
    online: "Online",
    offline: "Offline",
    never: "Sem dados",
};


const ONLINE_WINDOW_MS = 60_000;

export function lastSeenMs(server: Server): number {
    return server.last_seen ? new Date(server.last_seen).getTime() : 0;
}

export function getServerState(server: Server, now: number): ServerState {
    if (!server.last_seen) return "never";
    return now - lastSeenMs(server) <= ONLINE_WINDOW_MS ? "online" : "offline";
}

export function formatAgo(ms: number): string {
    const seconds = Math.max(0, Math.floor(ms / 1000));
    if (seconds < 60) return `há ${seconds} s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `há ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `há ${hours} h`;
    return `há ${Math.floor(hours / 24)} d`;
}

export function lastSeenText(server: Server, now: number): string {
    if (!server.last_seen) return "Nenhuma leitura recebida";
    return `Visto ${formatAgo(now - lastSeenMs(server))}`;
}