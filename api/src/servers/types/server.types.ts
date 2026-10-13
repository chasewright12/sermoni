export interface Server {
    id: number;
    hostname: string;
    operating_system: string;
    agent_version: string;
    created_at: Date;
    last_seen: Date | null;
}

export interface CreateServerData {
    hostname: string;
    operatingSystem: string;
    agentVersion: string;
}