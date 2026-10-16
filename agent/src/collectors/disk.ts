import si from "systeminformation";

const VIRTUAL_TYPES = new Set([
    "tmpfs",
    "devtmpfs",
    "squashfs",
    "overlay",
    "proc",
    "sysfs",
    "cgroup",
    "cgroup2",
    "devpts",
    "ramfs",
    "efivarfs"
]);

const IGNORED_MOUNT_PREFIXES = [
    "/snap",
    "/usr/lib/wsl",
    "/mnt/wslg",
    "/run",
    "/sys",
    "/proc"
];

function isIgnoredMount(mount: string): boolean {
    return IGNORED_MOUNT_PREFIXES.some(
        (prefix) => mount === prefix || mount.startsWith(`${prefix}/`)
    );
}

export async function getDiskInformation() {
    const disks = await si.fsSize();

    return disks
        .filter(
            (disk) =>
                disk.size > 0 &&
                !VIRTUAL_TYPES.has(disk.type) &&
                !isIgnoredMount(disk.mount)
        )
        .map((disk) => ({
            filesystem: disk.fs,
            size: disk.size,
            used: disk.used,
            percentage: disk.use
        }));
}