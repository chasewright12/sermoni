import { useEffect, useState } from "react";
import { API_URL } from "./api";
import type { Server, ServersResponse } from "./types";

export function useServers(intervalMs = 5000) {
    const [servers, setServers] = useState<Server[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        let active = true;

        async function load() {
            try {
                const res = await fetch(`${API_URL}/servers`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json: ServersResponse = await res.json();
                if (!active) return;
                setServers(json.data);
                setNow(Date.now());
                setError(null);
            } catch (err) {
                if (!active) return;
                setError(err instanceof Error ? err.message : "Erro desconhecido");
            } finally {
                if (active) setLoaded(true);
            }
        }

        load();
        const timer = setInterval(load, intervalMs);
        return () => {
            active = false;
            clearInterval(timer);
        };
    }, [intervalMs]);

    return { servers, now, loaded, error };
}