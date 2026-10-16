import { getStatus, STATUS_LABEL } from "../status";

interface GaugeProps {
  label: string;
  value: number;
  detail: string;
}

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function Gauge({ label, value, detail }: GaugeProps) {
  const clamped = Math.min(Math.max(value, 0), 100);
  const status = getStatus(clamped);

  return (
    <section
      className={`panel tone-${status}`}
      aria-label={`${label}: ${clamped.toFixed(1)}%`}
    >
      <div className="panel-head">
        <h2>{label}</h2>
        <span className={`badge badge-${status}`}>{STATUS_LABEL[status]}</span>
      </div>

      <div className="gauge-ring">
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <circle className="gauge-track" cx="60" cy="60" r={RADIUS} />
          <circle
            className="gauge-value"
            cx="60"
            cy="60"
            r={RADIUS}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - clamped / 100)}
            transform="rotate(-90 60 60)"
          />
        </svg>
        <p className="gauge-number">
          {clamped.toFixed(1)}
          <small>%</small>
        </p>
      </div>

      <p className="gauge-detail">{detail}</p>
    </section>
  );
}
