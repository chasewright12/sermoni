import { createHash, randomBytes } from "node:crypto";

const KEY_PREFIX = "sermoni_";

export function generateApiKey(): string {
    return KEY_PREFIX + randomBytes(32).toString("hex");
}

export function hashApiKey(key: string): string {
    return createHash("sha256").update(key).digest("hex");
}