
import Fastify from "fastify";
import cors from "@fastify/cors";

import { healthRoutes } from "./routes/health";
import { metricsRoutes } from "./routes/metrics";
import { serversRoutes } from "./routes/servers";
import { alertsRoutes } from "./routes/alerts";
import { serverKeysRoutes } from "./routes/serverKeys";
import { initializeDatabase, pool } from "./db";
import { startAlertScheduler } from "./alerts/scheduler";

const app = Fastify({
    logger: true
});

const corsOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim());

app.register(cors, { origin: corsOrigins });

app.register(healthRoutes);
app.register(metricsRoutes);
app.register(serversRoutes);
app.register(serverKeysRoutes);
app.register(alertsRoutes);

let stopAlertScheduler: (() => void) | undefined;

app.addHook("onClose", async () => {
    stopAlertScheduler?.();
    await pool.end();
});

export { app };

const start = async () => {
    try {
        await initializeDatabase();

        await app.listen({
            port: 3000,
            host: "0.0.0.0"
        });

        stopAlertScheduler = startAlertScheduler(app.log);

        console.log("Monitoring API running on port 3000.");
    } catch (error) {
        app.log.error(error);
        await app.close();
        process.exit(1);
    }
};

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
    start();
}
