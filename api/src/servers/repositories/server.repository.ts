import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../../db";
import type { Server, CreateServerData } from "../types/server.types";

interface ServerRow extends RowDataPacket {
    id: number;
    hostname: string;
    operating_system: string;
    agent_version: string;
    created_at: Date;
    last_seen: Date | null;
}


const serverColumns = `
    id,
    hostname,
    operating_system,
    agent_version,
    created_at,
    last_seen
`;


export async function createServer(
    data: CreateServerData
): Promise<Server> {
    const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO servers
            (hostname, operating_system, agent_version)
        VALUES (?, ?, ?)`,
        [
            data.hostname,
            data.operatingSystem,
            data.agentVersion
        ]
    );

    const server = await findServerById(result.insertId);

    if (!server) {
        throw new Error("Server was created but could not be retrieved");
    }

    return server;
}

export async function findServerById(
    id: number
): Promise<Server | null> {
    const [rows] = await pool.execute<ServerRow[]>(
        `SELECT ${serverColumns}
        FROM servers
        WHERE id = ?
        LIMIT 1`,
        [id]
    );

    return rows[0] ?? null;
}


export async function findAllServers(): Promise<Server[]> {
    const [rows] = await pool.execute<ServerRow[]>(
        `SELECT
            id,
            hostname,
            operating_system,
            agent_version,
            created_at,
            last_seen
         FROM servers
         ORDER BY id DESC`
    );

    return rows;
}


export async function updateLastSeen(id: number): Promise<void> {
    await pool.execute(
        `UPDATE servers
        SET last_seen = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [id]
    );
}