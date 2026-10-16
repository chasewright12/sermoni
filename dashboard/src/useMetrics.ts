import { useEffect, useState } from "react";
import { API_URL } from "./api";
import type { HistoryResponse, MetricRecord } from "./types";

interface State {
    serverId: number | null;
    records: MetricRecord[];
    loaded: boolean;
    error: string | null;
    updatedAt: Date | null;
}

const initial: State = {
    serverId: null,
    records: [],
    loaded: false,
    error: null,
    updatedAt: null,
};

export function useMetrics(
    serverId: number | null,
    limit = 60,
    intervalMs = 5000,
    paused = false,
) {
    const [state, setState] = useState<State>(initial);

    useEffect(() => {
        if (paused || serverId === null) return;
        let active = true;

        async function load() {
            try {
                const res = await fetch(
                    `${API_URL}/metrics/history?serverId=${serverId}&limit=${limit}`,
                );
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json: HistoryResponse = await res.json();
                if (!active) return;
                setState({
                    serverId,
                    records: [...json.data].reverse(),
                    loaded: true,
                    error: null,
                    updatedAt: new Date(),
                });
            } catch (err) {
                if (!active) return;
                const message = err instanceof Error ? err.message : "Erro desconhecido";
                setState((prev) =>
                    prev.serverId === serverId
                        ? { ...prev, loaded: true, error: message }
                        : { ...initial, serverId, loaded: true, error: message },
                );
            }
        }

        load();
        const timer = setInterval(load, intervalMs);
        return () => {
            active = false;
            clearInterval(timer);
        };
    }, [serverId, limit, intervalMs, paused]);

    return state.serverId === serverId ? state : { ...initial, serverId };
}