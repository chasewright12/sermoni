import type { FastifyBaseLogger } from "fastify";
import type { AlertMetric, AlertStatus } from "./types";

export interface AlertEvent {
    status: AlertStatus;
    hostname: string;
    metric: AlertMetric;
    value: number;
    threshold: number;
    durationSeconds: number;
}

export interface NotificationResult {
    channel: string;
    ok: boolean;
    error?: string;
}

interface Channel {
    name: string;
    isConfigured: () => boolean;
    send: (event: AlertEvent) => Promise<void>;
}

const TIMEOUT_MS = 5000;

const LABEL: Record<AlertMetric, string> = {
    cpu: "High CPU usage",
    memory: "High memory usage",
    disk: "High disk usage",
    offline: "Server offline"
};

function formatDuration(totalSeconds: number): string {
    const seconds = Math.round(totalSeconds);

    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)} min`;

    return `${(seconds / 3600).toFixed(1)} h`;
}

export function describeEvent(event: AlertEvent): string {
    if (event.metric === "offline") {
        return event.status === "firing"
            ? `No metrics received for ${formatDuration(event.value)} (limit: ${formatDuration(event.threshold)}).`
            : "The server is sending metrics again.";
    }

    if (event.status === "resolved") {
        return `Back to normal at ${event.value.toFixed(1)}%.`;
    }

    const sustained =
        event.durationSeconds > 0
            ? ` for ${formatDuration(event.durationSeconds)}`
            : "";

    return `Currently at ${event.value.toFixed(1)}%, above the ${event.threshold}% limit${sustained}.`;
}

function titleOf(event: AlertEvent): string {
    const prefix = event.status === "firing" ? "Alert" : "Resolved";

    return `${prefix}: ${LABEL[event.metric]} on ${event.hostname}`;
}

async function post(
    channel: string,
    url: string,
    init: { headers?: Record<string, string>; body: string }
): Promise<void> {
    const response = await fetch(url, {
        method: "POST",
        headers: init.headers,
        body: init.body,
        signal: AbortSignal.timeout(TIMEOUT_MS)
    });

    if (!response.ok) {
        throw new Error(`${channel} responded with HTTP ${response.status}`);
    }
}

const json = { "Content-Type": "application/json" };

/* ---------- canais ---------- */

const discord: Channel = {
    name: "discord",
    isConfigured: () => Boolean(process.env.DISCORD_WEBHOOK_URL),
    send: async (event) => {
        const url = process.env.DISCORD_WEBHOOK_URL;
        if (!url) return;

        const firing = event.status === "firing";

        await post("discord", url, {
            headers: json,
            body: JSON.stringify({
                username: "Sermoni",
                embeds: [
                    {
                        title: `${firing ? "Alert" : "Resolved"}: ${LABEL[event.metric]}`,
                        description: describeEvent(event),
                        color: firing ? 0xf0616d : 0x7ddc6b,
                        fields: [
                            { name: "Server", value: event.hostname, inline: true }
                        ],
                        timestamp: new Date().toISOString()
                    }
                ]
            })
        });
    }
};

const telegram: Channel = {
    name: "telegram",
    isConfigured: () =>
        Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
    send: async (event) => {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;
        if (!token || !chatId) return;

        await post("telegram", `https://api.telegram.org/bot${token}/sendMessage`, {
            headers: json,
            body: JSON.stringify({
                chat_id: chatId,
                text: `${titleOf(event)}\n\n${describeEvent(event)}`
            })
        });
    }
};

const slack: Channel = {
    name: "slack",
    isConfigured: () => Boolean(process.env.SLACK_WEBHOOK_URL),
    send: async (event) => {
        const url = process.env.SLACK_WEBHOOK_URL;
        if (!url) return;

        await post("slack", url, {
            headers: json,
            body: JSON.stringify({
                text: `*${titleOf(event)}*\n${describeEvent(event)}`
            })
        });
    }
};

// ntfy.sh: notificação push no celular, sem conta (https://ntfy.sh)
const ntfy: Channel = {
    name: "ntfy",
    isConfigured: () => Boolean(process.env.NTFY_URL),
    send: async (event) => {
        const url = process.env.NTFY_URL;
        if (!url) return;

        const firing = event.status === "firing";
        const headers: Record<string, string> = {
            Title: titleOf(event),
            Priority: firing ? "high" : "default",
            Tags: firing ? "rotating_light" : "white_check_mark"
        };

        if (process.env.NTFY_TOKEN) {
            headers.Authorization = `Bearer ${process.env.NTFY_TOKEN}`;
        }

        await post("ntfy", url, { headers, body: describeEvent(event) });
    }
};

const email: Channel = {
    name: "email",
    isConfigured: () =>
        Boolean(
            process.env.SMTP_HOST &&
            process.env.SMTP_USER &&
            process.env.SMTP_PASS &&
            process.env.ALERT_EMAIL_TO
        ),
    send: async (event) => {
        const host = process.env.SMTP_HOST;
        const user = process.env.SMTP_USER;
        const pass = process.env.SMTP_PASS;
        const to = process.env.ALERT_EMAIL_TO;
        if (!host || !user || !pass || !to) return;

        // importado só quando o e-mail está configurado
        const { createTransport } = await import("nodemailer");
        const port = Number(process.env.SMTP_PORT || 587);

        const transport = createTransport({
            host,
            port,
            secure: port === 465,
            auth: { user, pass },
            connectionTimeout: 10_000,
            greetingTimeout: 10_000,
            socketTimeout: 10_000
        });

        await transport.sendMail({
            from: process.env.ALERT_EMAIL_FROM || user,
            to,
            subject: `[Sermoni] ${titleOf(event)}`,
            text: `${describeEvent(event)}\n\nServer: ${event.hostname}`
        });
    }
};

const CHANNELS: Channel[] = [discord, telegram, slack, ntfy, email];

/** Nomes dos canais que têm configuração completa no ambiente. */
export function configuredChannels(): string[] {
    return CHANNELS.filter((channel) => channel.isConfigured()).map(
        (channel) => channel.name
    );
}

/**
 * Envia o evento para todos os canais configurados, em paralelo.
 * A falha de um canal não afeta os outros nem a avaliação dos alertas.
 */
export async function sendNotification(
    event: AlertEvent,
    log: FastifyBaseLogger
): Promise<NotificationResult[]> {
    const active = CHANNELS.filter((channel) => channel.isConfigured());

    // sem canal configurado, o alerta continua registrado no banco
    if (active.length === 0) {
        log.info({ alert: event }, "Alert event (no notification channel configured)");
        return [];
    }

    return Promise.all(
        active.map(async (channel): Promise<NotificationResult> => {
            try {
                await channel.send(event);

                return { channel: channel.name, ok: true };
            } catch (error) {
                log.error(
                    { channel: channel.name, err: error },
                    "Failed to send alert notification"
                );

                return {
                    channel: channel.name,
                    ok: false,
                    error: error instanceof Error ? error.message : "unknown error"
                };
            }
        })
    );
}