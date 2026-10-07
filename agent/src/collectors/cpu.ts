import si from "systeminformation";

export async function getCpuInformation() {
    const cpu = await si.currentLoad();

    return cpu.currentLoad;
}