import si from "systeminformation";

export async function getMemoryInformation() {
    const memory = await si.mem();

    return {
        total: memory.total,
        used: memory.used,
        free: memory.free,
        percentage: (memory.used / memory.total) * 100
    };
}