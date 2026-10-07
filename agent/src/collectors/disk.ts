import si from "systeminformation";

export async function getDiskInformation() {
    const disks = await si.fsSize();

    return disks.map(disk => ({
        filesystem: disk.fs,
        size: disk.size,
        used: disk.used,
        percentage: disk.use
    }));
}