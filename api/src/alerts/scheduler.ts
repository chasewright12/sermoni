import type { FastifyBaseLogger } from "fastify";
import { evaluateAllServers } from "../services/alert.service";

export function startAlertScheduler(
    log: FastifyBaseLogger,
    intervalMs: number = 30_000
): () => void {
    let running = false;

    async function tick() {
        if (running) return;
        running = true;

        try {
            await evaluateAllServers(log);
        } catch (error) {
            log.error(error, "Alert evaluation failed");
        } finally {
            running = false;
        }
    }

    void tick();

    const timer = setInterval(tick, intervalMs);
    timer.unref();

    return () => clearInterval(timer);
}