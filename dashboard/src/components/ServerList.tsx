import {
  getServerState,
  lastSeenText,
  SERVER_STATE_LABEL,
} from "../serverState";
import type { Server } from "../types";

interface ServerListProps {
  servers: Server[];
  now: number;
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export function ServerList({
  servers,
  now,
  selectedId,
  onSelect,
}: ServerListProps) {
  const onlineCount = servers.filter(
    (s) => getServerState(s, now) === "online",
  ).length;

  return (
    <section className="server-list" aria-label="Servidores">
      <div className="server-list-head">
        <h2>Servidores</h2>
        <span>
          {onlineCount} de {servers.length} online
        </span>
      </div>

      <div className="servers">
        {servers.map((server) => {
          const state = getServerState(server, now);

          return (
            <button
              key={server.id}
              type="button"
              className={`server-card server-${state}`}
              aria-pressed={server.id === selectedId}
              onClick={() => onSelect(server.id)}
            >
              <span className="server-top">
                <strong className="server-name">{server.hostname}</strong>
                <span className="state-pill">{SERVER_STATE_LABEL[state]}</span>
              </span>
              <span className="server-meta">{server.operating_system}</span>
              <span className="server-seen">{lastSeenText(server, now)}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
