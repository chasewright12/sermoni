import { getSystemInfo } from "./src/collectors/system";
import { getCpuInformation } from "./src/collectors/cpu";
import { getMemoryInformation } from "./src/collectors/memory";
import { getDiskInformation } from "./src/collectors/disk";
import { sendMetrics } from "./api";

async function main() {
    try {
        const system = await getSystemInfo();

        const metrics = {
            system: await getSystemInfo(),
            cpu: await getCpuInformation(),
            memory: await getMemoryInformation(),
            disk: await getDiskInformation(),
            timestamp: new Date().toISOString()
        };

        console.log("Collected metrics:");
        console.log(metrics);

        await sendMetrics(metrics);

        console.log("Metrics sent successfully.");
    } catch (error) {
        console.error("Agent error:", error);
    }
}

main();
setInterval(main, 10_000);