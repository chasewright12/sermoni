
import Fastify from "fastify";
import { healthRoutes } from "./routes/health";
import { metricsRoutes } from "./routes/metrics";
import { initializeDatabase, pool } from "./db";

const app = Fastify({
    logger: true
});

app.register(healthRoutes);
app.register(metricsRoutes);

app.addHook("onClose", async () => {
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
