import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CRIT_AT } from "../status";

export interface ChartPoint {
  time: string;
  cpu: number;
  memory: number;
  disk: number;
}

type SeriesKey = "cpu" | "memory" | "disk";

const SERIES: { key: SeriesKey; label: string; color: string }[] = [
  { key: "cpu", label: "CPU", color: "#5b9dff" },
  { key: "memory", label: "Memória", color: "#b18cff" },
  { key: "disk", label: "Disco", color: "#2dd4bf" },
];

export function UsageChart({ data }: { data: ChartPoint[] }) {
  const [hidden, setHidden] = useState<Set<SeriesKey>>(new Set());

  function toggle(key: SeriesKey) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Uso de recursos</h2>
        <div className="legend" role="group" aria-label="Séries exibidas">
          {SERIES.map((s) => (
            <button
              key={s.key}
              type="button"
              className="legend-btn"
              aria-pressed={!hidden.has(s.key)}
              onClick={() => toggle(s.key)}
            >
              <i style={{ background: s.color }} />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={340}>
        <AreaChart
          data={data}
          margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
        >
          <defs>
            {SERIES.map((s) => (
              <linearGradient
                key={s.key}
                id={`fill-${s.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={s.color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>

          <CartesianGrid
            vertical={false}
            stroke="#262626"
            strokeDasharray="2 4"
          />
          <XAxis
            dataKey="time"
            tickLine={false}
            axisLine={false}
            stroke="#a3a3a3"
            tick={{ fontSize: 12 }}
            minTickGap={56}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            unit="%"
            tickLine={false}
            axisLine={false}
            stroke="#a3a3a3"
            tick={{ fontSize: 12 }}
          />
          <ReferenceLine
            y={CRIT_AT}
            stroke="#f0616d"
            strokeDasharray="4 4"
            strokeOpacity={0.6}
          />
          <Tooltip
            contentStyle={{
              background: "#0c0c0c",
              border: "1px solid #262626",
              borderRadius: 8,
            }}
            labelStyle={{ color: "#a3a3a3" }}
            formatter={(value) => `${Number(value).toFixed(1)}%`}
          />

          {SERIES.filter((s) => !hidden.has(s.key)).map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              fill={`url(#fill-${s.key})`}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </section>
  );
}
