
import Fastify from "fastify";
import { healthRoutes } from "./routes/health";
import { metricsRoutes } from "./routes/metrics";

const app = Fastify({
    logger: true
});

app.register(healthRoutes);
app.register(metricsRoutes);

export { app };

const start = async () => {
    try {
        await app.listen({
            port: 3000,
            host: "0.0.0.0"
        });

        console.log("Monitoring API running on port 3000.");
    } catch (error) {
        app.log.error(error);
        process.exit(1);
    }
};

if (import.meta.url === `file://${process.argv[1]}`) {
    start();
}
