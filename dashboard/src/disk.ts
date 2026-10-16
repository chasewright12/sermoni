import type { DiskInfo } from "./types";

export function pickMainDisk(disks: DiskInfo[]): DiskInfo | undefined {
    return disks.reduce<DiskInfo | undefined>(
        (best, d) => (!best || d.size > best.size ? d : best),
        undefined,
    );
}