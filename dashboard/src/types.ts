export interface DiskInfo {
    size: number;
    used: number;
    filesystem: string;
    percentage: number;
}

export interface Metrics {
    cpu: number;
    disk: DiskInfo[];
    memory: {
        free: number;
        used: number;
        total: number;
        percentage: number;
    };
    system: {
        cpu: { cores: number };
        uptime: number;
        hardware: { model: string; manufacturer: string };
        hostname: string;
        operatingSystem: {
            arch: string;
            distro: string;
            release: string;
            platform: string;
        };
    };
    timestamp: string;
}

export interface MetricRecord {
    id: number;
    server_id: number | null;
    payload: Metrics;
}

export interface HistoryResponse {
    count: number;
    limit: number;
    data: MetricRecord[];
}

export interface Server {
    id: number;
    hostname: string;
    operating_system: string;
    agent_version: string;
    created_at: string;
    last_seen: string | null;
}

export interface ServersResponse {
    count: number;
    data: Server[];
}