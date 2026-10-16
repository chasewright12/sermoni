export type Status = "ok" | "warn" | "crit";

export const WARN_AT = 70;
export const CRIT_AT = 90;

export const STATUS_LABEL: Record<Status, string> = {
    ok: "Normal",
    warn: "Atenção",
    crit: "Crítico",
};

export function getStatus(percentage: number): Status {
    if (percentage >= CRIT_AT) return "crit";
    if (percentage >= WARN_AT) return "warn";
    return "ok";
}