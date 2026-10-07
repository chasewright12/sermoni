import si from "systeminformation";
import os from "node:os";

export async function getSystemInfo() {
    const system = await si.system();
    const osInfo = await si.osInfo();

    return {
        hostname: os.hostname(),

        operatingSystem: {
            platform: osInfo.platform,
            distro: osInfo.distro,
            release: osInfo.release,
            arch: osInfo.arch
        },

        hardware: {
            manufacturer: system.manufacturer,
            model: system.model
        },

        uptime: os.uptime(),

        cpu: {
            cores: os.cpus().length
        }
    };
}