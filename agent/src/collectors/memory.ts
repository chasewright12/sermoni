import si from "systeminformation";

export async function getMemoryInformation() {
    const memory = await si.mem();
    const used = memory.total - memory.available;

    return {
        total: memory.total,
        used,
        free: memory.available,
        percentage: (used / memory.total) * 100
    };
}