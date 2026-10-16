import { useState } from "react";
import logo from "./assets/logo.png";
import { Gauge } from "./components/Gauge";
import { ServerList } from "./components/ServerList";
import { UsageChart, type ChartPoint } from "./components/UsageChart";
import { pickMainDisk } from "./disk";
import { lastSeenMs } from "./serverState";
import { getStatus } from "./status";
import type { Server } from "./types";
import { useMetrics } from "./useMetrics";
import { useServers } from "./useServers";
import "./App.css";

const RANGES = [30, 60, 120, 200] as const;

type Connection = "live" | "paused" | "offline";

const CONNECTION_LABEL: Record<Connection, string> = {
  live: "Ao vivo",
  paused: "Pausado",
  offline: "Sem conexão",
};

const toGB = (bytes: number) => (bytes / 1024 ** 3).toFixed(1);

function formatUptime(seconds: number) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m`;
}

const timeFormat: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
};

export default function App() {
  const [limit, setLimit] = useState<number>(60);
  const [paused, setPaused] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const {
    servers,
    now,
    loaded: serversLoaded,
    error: serversError,
  } = useServers();

  // sem escolha do usuário, mostra o servidor visto mais recentemente
  const defaultServer = servers.reduce<Server | undefined>(
    (best: Server | undefined, s: Server) =>
      !best || lastSeenMs(s) > lastSeenMs(best) ? s : best,
    undefined,
  );
  const activeServer =
    servers.find((s) => s.id === selectedId) ?? defaultServer;
  const activeId = activeServer?.id ?? null;

  const { records, error, loaded, updatedAt } = useMetrics(
    activeId,
    limit,
    5000,
    paused,
  );

  const latest = records.at(-1)?.payload;
  const mainDisk = latest ? pickMainDisk(latest.disk) : undefined;
  const apiError = error ?? serversError;
  const connection: Connection = apiError
    ? "offline"
    : paused
      ? "paused"
      : "live";

  const chartData: ChartPoint[] = records.map(({ payload }) => ({
    time: new Date(payload.timestamp).toLocaleTimeString("pt-BR", timeFormat),
    cpu: payload.cpu,
    memory: payload.memory.percentage,
    disk: pickMainDisk(payload.disk)?.percentage ?? 0,
  }));

  return (
    <div className="shell">
      <header className="topbar">
        <div className="identity">
          <img className="logo" src={logo} alt="" />
          <h1 className="sr-only">Sermoni</h1>
          <span className="brand" aria-hidden="true">
            |
          </span>
          {activeServer && (
            <div className="host">
              <p>Host:</p>
              <strong>{activeServer.hostname}</strong>
            </div>
          )}
        </div>

        <div className="controls">
          <span className={`status status-${connection}`} role="status">
            <i className="status-dot" />
            {CONNECTION_LABEL[connection]}
            {updatedAt && connection === "live" && (
              <time>
                {" "}
                às {updatedAt.toLocaleTimeString("pt-BR", timeFormat)}
              </time>
            )}
          </span>

          <label className="sr-only" htmlFor="range">
            Quantidade de leituras
          </label>
          <select
            id="range"
            className="field"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
          >
            {RANGES.map((n) => (
              <option key={n} value={n}>
                Últimas {n} leituras
              </option>
            ))}
          </select>

          <button
            type="button"
            className="field"
            onClick={() => setPaused((p) => !p)}
          >
            {paused ? "Retomar" : "Pausar"}
          </button>
        </div>
      </header>

      {apiError && (
        <p className="banner" role="alert">
          {serversLoaded && servers.length > 0
            ? "A conexão com a API foi perdida. Exibindo os últimos dados recebidos."
            : "Não foi possível conectar à API. Confira se ela está rodando na porta 3000."}
        </p>
      )}

      {servers.length > 0 && (
        <ServerList
          servers={servers}
          now={now}
          selectedId={activeId}
          onSelect={setSelectedId}
        />
      )}

      {!serversLoaded && !serversError && (
        <p className="empty">Carregando servidores…</p>
      )}

      {serversLoaded && !serversError && servers.length === 0 && (
        <p className="empty">
          Nenhum servidor cadastrado ainda. Inicie o agente com{" "}
          <code>npx tsx agent/index.ts</code>.
        </p>
      )}

      {activeServer && !loaded && !error && (
        <p className="empty">Aguardando a primeira leitura…</p>
      )}

      {activeServer && loaded && !error && records.length === 0 && (
        <p className="empty">Este servidor ainda não enviou métricas.</p>
      )}

      {latest && (
        <main>
          <div className="gauges">
            <Gauge
              label="CPU"
              value={latest.cpu}
              detail={`${latest.system.cpu.cores} núcleos`}
            />
            <Gauge
              label="Memória"
              value={latest.memory.percentage}
              detail={`${toGB(latest.memory.used)} de ${toGB(latest.memory.total)} GB`}
            />
            <Gauge
              label="Disco"
              value={mainDisk?.percentage ?? 0}
              detail={`${toGB(mainDisk?.used ?? 0)} de ${toGB(mainDisk?.size ?? 0)} GB`}
            />
          </div>

          <div className="lower">
            <UsageChart data={chartData} />

            <aside className="side">
              <section className="panel">
                <h2>Armazenamento</h2>
                <div className="disks">
                  {[...latest.disk]
                    .sort((a, b) => b.size - a.size)
                    .map((d, index) => (
                      <div
                        key={`${d.filesystem}-${index}`}
                        className={`disk-row tone-${getStatus(d.percentage)}`}
                      >
                        <div className="disk-head">
                          <span>{d.filesystem}</span>
                          <span>
                            {toGB(d.used)} / {toGB(d.size)} GB
                          </span>
                        </div>
                        <div className="bar">
                          <span
                            style={{ width: `${Math.min(d.percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </section>

              <section className="panel">
                <h2>Sistema</h2>
                <dl className="info">
                  <dt>Sistema operacional</dt>
                  <dd>
                    {latest.system.operatingSystem.distro}{" "}
                    {latest.system.operatingSystem.release}
                  </dd>
                  <dt>Arquitetura</dt>
                  <dd>{latest.system.operatingSystem.arch}</dd>
                  <dt>Hardware</dt>
                  <dd>
                    {latest.system.hardware.manufacturer}{" "}
                    {latest.system.hardware.model}
                  </dd>
                  <dt>Núcleos de CPU</dt>
                  <dd>{latest.system.cpu.cores}</dd>
                  <dt>Tempo ligado</dt>
                  <dd>{formatUptime(latest.system.uptime)}</dd>
                  <dt>Última leitura</dt>
                  <dd>
                    {new Date(latest.timestamp).toLocaleTimeString(
                      "pt-BR",
                      timeFormat,
                    )}
                  </dd>
                </dl>
              </section>
            </aside>
          </div>
        </main>
      )}
    </div>
  );
}
