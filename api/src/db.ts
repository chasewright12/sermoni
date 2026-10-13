
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "node:path";
import { existsSync } from "node:fs";

const envCandidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../.env")
];

const envPath = envCandidates.find((candidate) =>
    existsSync(candidate)
);

if (!envPath) {
    throw new Error("Could not find the project .env file");
}

dotenv.config({ path: envPath });


const database = process.env.MYSQL_DATABASE || "sermoni";

if (!/^[a-zA-Z0-9_]+$/.test(database)) {
    throw new Error("Invalid MYSQL_DATABASE name");
}

export const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || "sermoni",
    password: process.env.MYSQL_PASSWORD,
    database,
    waitForConnections: true,
    connectionLimit: 10
});


export async function initializeDatabase() {
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS metrics (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
            metric_timestamp DATETIME(3) NOT NULL,
            payload JSON NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_metric_timestamp (metric_timestamp)
        )
    `);

    await pool.execute(`
        CREATE TABLE IF NOT EXISTS servers (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
            hostname VARCHAR(255) NOT NULL,
            operating_system VARCHAR(100) NOT NULL,
            agent_version VARCHAR(50) NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            last_seen TIMESTAMP NULL DEFAULT NULL,
            UNIQUE KEY uq_servers_hostname (hostname)
        )
    `);

    console.log("Database initialized successfully.");
}
