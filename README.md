# Sermoni — Server Monitoring

<div align="center">

<img src="https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExY3J3NGZyODlyZ3AwMzF5dGN0ZmFqcGd5c2JtY3ZoMjRydGowaDE2aCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/LGzrggUppEBdm/giphy.gif" alt="Sermoni animation">

**A lightweight server monitoring system built with TypeScript.**

<p align="center">
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="https://fastify.dev/"><img src="https://img.shields.io/badge/Fastify-000000?style=flat-square&logo=fastify&logoColor=white" alt="Fastify"></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React"></a>
  <a href="https://vite.dev/"><img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite"></a>
  <a href="https://www.mysql.com/"><img src="https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white" alt="MySQL"></a>
  <a href="https://www.docker.com/"><img src="https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker"></a>
  <a href="https://vitest.dev/"><img src="https://img.shields.io/badge/Vitest-6E9F18?style=flat-square&logo=vitest&logoColor=white" alt="Vitest"></a>
</p>

</div>

Sermoni is a server monitoring project designed to collect system metrics and store them in a MySQL database through an HTTP API. A TypeScript monitoring agent periodically collects CPU, memory, disk, and system information. The Fastify API validates incoming payloads with Zod and persists accepted metrics in MySQL.

Each metric is associated with a registered server. The API authenticates monitoring agents with API keys, tracks each server's last contact, and exposes endpoints for retrieving the latest metrics and historical data. A dedicated `servers` module separates routes, services, repositories, schemas, and types.

Sermoni also includes an automated alerting pipeline. Configurable rules evaluate CPU, memory, disk usage, and server availability. Alert events are persisted in MySQL, transition between `firing` and `resolved`, and can be sent through configured notification channels such as ntfy. The repository includes a React, Vite, and Recharts dashboard for viewing monitored servers and resource usage.

The project is developed with TypeScript and includes modular API routes, a periodic alert scheduler, automated tests with Vitest, and a Docker Compose configuration for MySQL.

## Features

- System and hardware information collection
- CPU usage monitoring
- Memory usage monitoring based on used and available memory
- Disk usage monitoring, filtering out virtual filesystems
- Periodic metric collection and HTTP transmission
- REST API built with Fastify
- Runtime request validation with Zod
- Agent authentication with hashed API keys
- Administrative authentication for API key issuance and alert-rule management
- Persistent metric storage with MySQL and JSON payloads
- Metrics linked to servers through a `server_id` foreign key
- Server registration and `last_seen` tracking
- Latest metrics retrieval endpoint
- Historical metrics endpoint with date-range, server, and limit filters
- Layered `servers` module (routes → services → repositories)
- Configurable CORS origins through environment variables
- UTC timestamps stored and read consistently
- Automated alert rules for CPU, memory, disk, and offline servers
- Global alert rules and server-specific overrides
- Configurable thresholds, evaluation windows, and enabled/disabled rules
- Alert lifecycle tracking with `firing` and `resolved` statuses
- Duplicate-alert prevention while an alert is already firing
- Periodic alert evaluation, running immediately at startup and then every 30 seconds
- Notification delivery through configured channels: Discord, Telegram, Slack, ntfy, and SMTP email
- Manual notification test endpoint
- Web dashboard with live gauges, usage charts, and a server list
- API health check endpoint
- Docker Compose configuration for MySQL
- Automated evaluator, rule-selection, alert-lifecycle, and API tests with Vitest
- TypeScript-based implementation

## Architecture

```text
┌─────────────────────────────────┐    ┌─────────────────────────────────┐
│          Monitoring Agent       │    │          Web Dashboard          │
│                                 │    │                                 │
│  CPU · Memory · Disk            │    │  React · Vite · Recharts         │
│  System and Hardware Info       │    │  Gauges · Charts · Server list  │
└────────────────┬────────────────┘    └────────────────┬────────────────┘
                 │                                       │
                 │ POST /metrics                         │ GET /servers
                 │ Authorization: Bearer API_KEY        │ GET /metrics/history
                 ▼                                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            Monitoring API                               │
│                                                                         │
│  Fastify · Zod · CORS · Agent/Admin authentication                      │
│                                                                         │
│  routes/metrics.ts  routes/servers.ts  routes/serverKeys.ts              │
│  routes/alerts.ts   routes/health.ts                                     │
│           │                 │                  │                         │
│           ▼                 ▼                  ▼                         │
│  Server services/repositories       Alert service                       │
│                                     ├── Rule evaluator                  │
│                                     ├── 30-second scheduler             │
│                                     └── Notification channels           │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                │ INSERT / SELECT / UPDATE
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                                MySQL 8.4                                │
│                                                                         │
│  servers       metrics       alert_rules       alerts                   │
└─────────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                  Discord · Telegram · Slack · ntfy · SMTP
```

## Project Structure

```text
server-monitor/
├── agent/
│   ├── src/
│   │   └── collectors/
│   │       ├── cpu.ts
│   │       ├── memory.ts
│   │       ├── disk.ts
│   │       └── system.ts
│   ├── api.ts
│   └── index.ts
├── api/
│   ├── src/
│   │   ├── alerts/
│   │   │   ├── evaluator.ts
│   │   │   ├── notifier.ts
│   │   │   ├── scheduler.ts
│   │   │   └── types.ts
│   │   ├── auth/
│   │   │   └── hooks.ts
│   │   ├── repositories/
│   │   │   └── alert.repository.ts
│   │   ├── routes/
│   │   │   ├── alerts.ts
│   │   │   ├── health.ts
│   │   │   ├── metrics.ts
│   │   │   ├── serverKeys.ts
│   │   │   └── servers.ts
│   │   ├── schemas/
│   │   │   └── metrics.schema.ts
│   │   ├── servers/
│   │   │   ├── repositories/
│   │   │   │   └── server.repository.ts
│   │   │   ├── schemas/
│   │   │   ├── services/
│   │   │   │   └── server.service.ts
│   │   │   └── types/
│   │   ├── services/
│   │   │   └── alert.service.ts
│   │   ├── db.ts
│   │   └── server.ts
│   ├── tests/
│   │   ├── alert.service.lifecycle.test.ts
│   │   ├── alert.service.test.ts
│   │   ├── alerts.evaluator.test.ts
│   │   └── server.test.ts
│   ├── package.json
│   └── package-lock.json
├── dashboard/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── Gauge.tsx
│   │   │   ├── ServerList.tsx
│   │   │   └── UsageChart.tsx
│   │   ├── api.ts
│   │   ├── App.css
│   │   ├── App.tsx
│   │   ├── disk.ts
│   │   ├── index.css
│   │   ├── main.tsx
│   │   ├── serverState.ts
│   │   ├── status.ts
│   │   ├── types.ts
│   │   ├── useMetrics.ts
│   │   └── useServers.ts
│   ├── index.html
│   ├── package.json
│   └── package-lock.json
├── docker-compose.yml
├── package.json
├── package-lock.json
├── .env                 # local only; never commit
├── .gitignore
└── README.md
```

## Technologies

- **TypeScript** — application development and static typing
- **Node.js** — JavaScript runtime
- **Fastify** — HTTP server and routing
- **@fastify/cors** — configurable CORS for the dashboard
- **Zod** — runtime validation of incoming metric, server, and alert-rule payloads
- **systeminformation** — system and hardware metrics collection
- **MySQL 8.4** — persistent storage for metrics, servers, rules, and alert events
- **mysql2** — MySQL client for Node.js
- **dotenv** — environment variable loading
- **React** — dashboard user interface
- **Vite** — dashboard development server and build tool
- **Recharts** — dashboard charts
- **Docker Compose** — local database setup and management
- **tsx** — TypeScript execution during development
- **Vitest** — automated testing

## How It Works

### 1. Monitoring Agent

The agent runs on the monitored machine and periodically collects:

- CPU usage
- Total, used, and available memory
- Disk usage for available storage devices
- Operating system information
- Hostname and hardware details
- CPU core count
- System uptime

Memory usage is based on available memory so reclaimable Linux file cache is not incorrectly treated as fully occupied RAM. The disk collector filters virtual filesystems and internal system mounts.

The collected data is assembled into a JSON payload and sent to `POST /metrics` with an API key in the `Authorization: Bearer <key>` header. The API key is issued for a registered server and its hash is stored in MySQL; the raw key is returned only when issued, so store it securely in the local `.env` file as `SERMONI_API_KEY`.

### 2. Monitoring API and Authentication

The API receives metric submissions through:

```http
POST /metrics
Authorization: Bearer <SERMONI_API_KEY>
```

The API authenticates the agent before validating the payload. The payload is then validated using the Zod schema in `api/src/schemas/metrics.schema.ts`.

- Valid, authenticated payloads are stored in MySQL and return HTTP `201 Created`, including the associated `serverId`.
- Invalid payloads from an authenticated agent return HTTP `400 Bad Request`.
- Missing or invalid agent keys return HTTP `401 Unauthorized`.
- Database errors return HTTP `500 Internal Server Error`.

Administrative operations use `ADMIN_TOKEN` through the `Authorization: Bearer <token>` header. The token protects API key issuance, alert-rule creation and updates, and the notification test endpoint. Keep admin and agent credentials separate.

### 3. MySQL Persistence

The API stores accepted metric payloads in `metrics`. Each record contains:

- `id` — unique record identifier
- `server_id` — the server that sent the metrics, referencing `servers.id`
- `metric_timestamp` — timestamp supplied by the monitoring agent
- `payload` — collected metrics stored as JSON
- `created_at` — database record creation time

The `servers` table contains the server hostname, operating system, agent version, creation time, API-key hash, and `last_seen` timestamp. Server IDs connect metric records and alert events to a monitored server.

The alerting subsystem uses two additional tables:

- `alert_rules` stores the metric, optional server scope, threshold, duration, enabled state, and creation/update timestamps.
- `alerts` stores each alert event, including server, rule, metric, status, observed value, threshold, start time, and optional resolution time.

The database connection uses UTC so timestamps can be compared consistently. MySQL and its persistent volume are configured in `docker-compose.yml`.

**Alert schema setup:** the current repository does not yet include a migration framework for `alert_rules` and `alerts`. On a fresh database, create these tables after starting MySQL and before relying on alert endpoints. Connect to the `sermoni` database and run:

```sql
CREATE TABLE IF NOT EXISTS alert_rules (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    server_id BIGINT UNSIGNED NULL,
    metric ENUM('cpu', 'memory', 'disk', 'offline') NOT NULL,
    threshold DOUBLE NOT NULL,
    duration_seconds INT UNSIGNED NOT NULL DEFAULT 0,
    enabled TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_alert_rules_server_metric (server_id, metric),
    CONSTRAINT fk_alert_rules_server
        FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
    CONSTRAINT chk_alert_rules_threshold_positive CHECK (threshold > 0),
    CONSTRAINT chk_alert_rules_percentage_threshold
        CHECK (metric = 'offline' OR threshold <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS alerts (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    server_id BIGINT UNSIGNED NOT NULL,
    rule_id BIGINT UNSIGNED NULL,
    metric ENUM('cpu', 'memory', 'disk', 'offline') NOT NULL,
    status ENUM('firing', 'resolved') NOT NULL DEFAULT 'firing',
    value DOUBLE NOT NULL,
    threshold DOUBLE NOT NULL,
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_alerts_server_status (server_id, status),
    KEY idx_alerts_rule_status (rule_id, status),
    KEY idx_alerts_started_at (started_at),
    CONSTRAINT fk_alerts_server
        FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
    CONSTRAINT fk_alerts_rule
        FOREIGN KEY (rule_id) REFERENCES alert_rules(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

### 4. Retrieving Metrics

The latest metric payload is available through:

```http
GET /metrics
```

The optional `serverId` query parameter returns the latest payload for a specific server. If no metrics have been recorded, the endpoint returns HTTP `404 Not Found`.

```bash
curl "http://localhost:3000/metrics?serverId=3"
```

### 5. Retrieving Metric History

Use `GET /metrics/history` to retrieve stored records from newest to oldest. It supports these query parameters:

- `limit` — number of records to return. Defaults to `50`; valid range is `1` to `200`.
- `from` — optional start of the time range as an ISO 8601 timestamp with a timezone.
- `to` — optional end of the time range as an ISO 8601 timestamp with a timezone.
- `serverId` — optional server identifier.

Examples:

```bash
curl "http://localhost:3000/metrics/history?limit=5"
curl "http://localhost:3000/metrics/history?serverId=3&limit=5"
curl "http://localhost:3000/metrics/history?from=2026-10-10T07:00:00Z&to=2026-10-10T07:04:00Z"
```

The response includes `count`, `limit`, and `data`. Each record includes its database ID, `server_id`, timestamps, and the original payload. Query parameters are validated and passed to parameterized SQL queries.

### 6. Servers Module and API Keys

Server management is implemented in `api/src/routes/servers.ts` and the layered `servers` module. Routes receive HTTP requests, Zod schemas validate input, services implement business rules, and repositories perform database operations through `mysql2`.

A server must exist in `servers` before an agent API key can be issued. Register or inspect servers through `POST /servers`, `GET /servers`, and `GET /servers/:id`. To issue or rotate an agent key, use the admin-protected endpoint:

```http
POST /servers/:id/api-key
Authorization: Bearer <ADMIN_TOKEN>
```

The response contains the new `apiKey` once. Store it in the root `.env` as `SERMONI_API_KEY` and restart the agent. The database stores a hash, so the raw key cannot be retrieved later. Issuing a new key replaces the previous key for that server.

### 7. Automated Alerts

The alert service evaluates enabled rules against recent metric points and each server's `last_seen` timestamp. The scheduler performs an initial evaluation at startup and then runs every 30 seconds.

Supported metrics:

- `cpu` — CPU usage percentage
- `memory` — memory usage percentage
- `disk` — percentage for the largest reported disk in each metric sample
- `offline` — seconds since the server was last seen

Rules can be global (`serverId: null`) or scoped to a specific server. A server-specific rule overrides the global rule for that metric. Disabled rules are not evaluated. For percentage metrics, thresholds must be greater than `0` and at most `100`; the offline threshold is expressed in seconds.

For CPU, memory, and disk rules, `durationSeconds: 0` evaluates the latest fresh sample immediately. A positive duration requires recent readings above the threshold across the configured time window. Samples older than 60 seconds are considered stale and do not trigger percentage-based alerts. Offline rules use their threshold as the silence duration.

When a condition first becomes true, the service creates a `firing` record and sends a notification. It avoids creating duplicate alerts while an alert for the same rule is already open. When the condition recovers, the record is marked `resolved` and a resolution notification is sent. Alert records remain in the database as history.

#### Alert rules endpoints

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/alert-rules` | Lists configured alert rules | No admin token currently required |
| `POST` | `/alert-rules` | Creates a rule | Admin token |
| `PATCH` | `/alert-rules/:id` | Updates a rule threshold, duration, or enabled state | Admin token |
| `GET` | `/alerts` | Lists alert history | No admin token currently required |
| `POST` | `/alerts/test` | Sends a test notification to configured channels | Admin token |

`GET /alerts` accepts `status` (`firing` or `resolved`), `serverId`, and `limit` (from `1` to `200`) query parameters.

Example: create a global CPU rule for usage above 80% sustained for 60 seconds:

```json
{
  "serverId": null,
  "metric": "cpu",
  "threshold": 80,
  "durationSeconds": 60,
  "enabled": true
}
```

Send it to `POST /alert-rules` with `Authorization: Bearer <ADMIN_TOKEN>` and `Content-Type: application/json`.

### 8. Notifications

The notifier sends alert and recovery events to every configured channel. The currently supported integrations are:

| Channel | Environment variables |
|---|---|
| ntfy | `NTFY_URL`; optional `NTFY_TOKEN` |
| Discord | `DISCORD_WEBHOOK_URL` |
| Telegram | `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` |
| Slack | `SLACK_WEBHOOK_URL` |
| SMTP email | `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `ALERT_EMAIL_TO`; optional `SMTP_PORT` and `ALERT_EMAIL_FROM` |

The ntfy channel is suitable for testing push notifications on a phone. Set `NTFY_URL` to the topic URL, such as `https://ntfy.sh/<your-random-topic>`, and subscribe to the same topic in the ntfy app. Topics on the public `ntfy.sh` service are not private: use a long, random topic name and avoid sensitive message content. Configure authentication or a private ntfy instance if stronger privacy is required.

The test endpoint `POST /alerts/test`, protected by `ADMIN_TOKEN`, sends a sample CPU alert to every configured notification channel. When no channel is configured, the endpoint returns HTTP `400`. Notification delivery results indicate which configured channels accepted or failed to send the message.

### 9. Web Dashboard

The dashboard, located in `dashboard/`, is a React application built with Vite and Recharts. It reads data from the API every five seconds and provides:

- A server list showing **Online** (metrics received within the last minute), **Offline**, or **No data**
- Gauges for CPU, memory, and disk usage, with warning and critical states at configured UI thresholds
- Usage charts for CPU, memory, and disk over time, with toggleable series
- A storage panel listing each disk
- A system panel with operating system, architecture, hardware, CPU cores, and uptime
- A selector for the number of readings displayed (30, 60, 120, or 200) and a pause button
- Messages for connection errors, missing servers, and servers without metrics

The dashboard displays one server at a time. It selects a recently seen server by default; selecting another server changes the gauges and charts. Alert-rule management and alert history are currently exposed through the API rather than a dedicated dashboard interface.

Local URL: <http://localhost:5173>

### 10. Health Check

The API provides a health endpoint:

```http
GET /health
```

Example response:

```json
{
  "status": "ok"
}
```

This endpoint checks API availability; it should not be interpreted as a complete database or notification-provider health check.

## Installation and Setup

### Prerequisites

- Node.js and npm
- Docker and Docker Compose
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/rootmannwright/server-monitor.git
cd server-monitor
```

### 2. Install Dependencies

Install root, API, and dashboard dependencies:

```bash
npm install
cd api && npm install && cd ..
cd dashboard && npm install && cd ..
```

Ensure Vitest is installed as a development dependency at the project root so test runs are repeatable:

```bash
npm install -D vitest
```

### 3. Configure Environment Variables

Create a `.env` file in the project root with your own values:

```dotenv
MYSQL_ROOT_PASSWORD=your_secure_root_password
MYSQL_DATABASE=sermoni
MYSQL_USER=sermoni
MYSQL_PASSWORD=your_secure_database_password
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
CORS_ORIGIN=http://localhost:5173
ADMIN_TOKEN=replace_with_a_long_random_admin_token
NTFY_URL=https://ntfy.sh/replace-with-a-long-random-topic
# NTFY_TOKEN=optional_ntfy_token
# SERMONI_API_KEY=populated_after_issuing_a_server_key
```

`ADMIN_TOKEN` protects administrative operations. `SERMONI_API_KEY` is the key issued for the server being monitored; obtain it after the server record exists, then add it to `.env`. Do not commit `.env`, API keys, admin tokens, webhook URLs, or database credentials.

`CORS_ORIGIN` controls which browser origins may call the API. Multiple origins may be separated by commas. If it is omitted, the API defaults to `http://localhost:5173`.

The dashboard reads its API address from `VITE_API_URL`, which defaults to `http://localhost:3000`. To override it, create `dashboard/.env`:

```dotenv
VITE_API_URL=http://localhost:3000
```

### 4. Start MySQL

From the project root:

```bash
docker compose up -d
docker compose ps
```

Wait until the MySQL service reports that it is healthy. The Compose configuration binds MySQL to `127.0.0.1:3306` and uses a named volume for persistence.

MySQL initializes its database and user credentials when the data directory is first created. Changing `.env` later does not automatically change credentials in an existing database volume.

### 5. Start the API

Open a terminal:

```bash
cd api
npm run dev
```

The API initializes its existing database structures and listens on port `3000`. Ensure the `alert_rules` and `alerts` tables have also been created using the SQL in the **MySQL Persistence** section; the current project does not yet apply that alert schema through migrations automatically.

Verify the health endpoint:

```bash
curl http://localhost:3000/health
```

### 6. Register a Server and Issue an Agent Key

Register a server through `POST /servers` if it does not already exist. Then issue its agent API key through `POST /servers/:id/api-key`, authenticated with `ADMIN_TOKEN`. The API returns the key once; save it in the root `.env` as `SERMONI_API_KEY`. Do not put the key into source code or commit it.

### 7. Start the Monitoring Agent

Open a second terminal:

```bash
cd ~/projects/server-monitor
npx tsx agent/index.ts
```

The agent collects system metrics and sends them to `POST /metrics` periodically. Keep the API and agent running during local monitoring. A successful response is required for metrics to be persisted; the agent reports non-success HTTP statuses as errors.

### 8. Start the Dashboard

Open a third terminal:

```bash
cd ~/projects/server-monitor/dashboard
npm run dev
```

Open <http://localhost:5173> in your browser. Use `localhost` rather than `127.0.0.1` unless both origins are listed in `CORS_ORIGIN`.

### 9. Configure and Test Notifications

Add `NTFY_URL` to the root `.env`, subscribe to the same topic in the ntfy app, and restart the API so it loads the updated configuration. To send a test notification, use `POST /alerts/test` with the admin bearer token. Avoid placing a real token directly in shell history.

## Running the Project

| Component | Command | Purpose |
|---|---|---|
| MySQL | `docker compose up -d` | Starts the database |
| API | `cd api && npm run dev` | Starts the monitoring API and alert scheduler |
| Agent | `npx tsx agent/index.ts` | Collects and submits metrics |
| Dashboard | `cd dashboard && npm run dev` | Starts the web dashboard |
| Tests | `npx vitest run` | Runs the Vitest suite from the project root |

Run the API, agent, and dashboard in separate terminals. Start MySQL before starting the API. The alert scheduler starts with the API and evaluates alert conditions immediately, then every 30 seconds.

## API Endpoints

| Method | Endpoint | Description | Authentication |
|---|---|---|---|
| `GET` | `/health` | Checks API availability | None |
| `POST` | `/metrics` | Validates and stores a metric payload | Agent API key |
| `GET` | `/metrics` | Retrieves the latest metric payload, optionally filtered by `serverId` | None currently required |
| `GET` | `/metrics/history` | Retrieves historical metrics with `limit`, `from`, `to`, and `serverId` filters | None currently required |
| `GET` | `/servers` | Lists registered servers | None currently required |
| `POST` | `/servers` | Registers a server | None currently required |
| `GET` | `/servers/:id` | Retrieves a server | None currently required |
| `POST` | `/servers/:id/api-key` | Issues or rotates a server API key | Admin token |
| `GET` | `/alert-rules` | Lists alert rules | None currently required |
| `POST` | `/alert-rules` | Creates an alert rule | Admin token |
| `PATCH` | `/alert-rules/:id` | Updates an alert rule | Admin token |
| `GET` | `/alerts` | Lists alert events; supports `status`, `serverId`, and `limit` | None currently required |
| `POST` | `/alerts/test` | Sends a test notification to configured channels | Admin token |

## Database Verification

Open the MySQL client inside the container:

```bash
docker exec -it sermoni-mysql mysql -u root -p sermoni
```

Then run:

```sql
SHOW TABLES;
SELECT id, server_id, metric_timestamp, created_at
FROM metrics
ORDER BY id DESC
LIMIT 5;

SELECT id, hostname, operating_system, last_seen
FROM servers;

SELECT id, server_id, metric, threshold, duration_seconds, enabled
FROM alert_rules;

SELECT id, server_id, rule_id, metric, status, value, threshold, started_at, resolved_at
FROM alerts
ORDER BY started_at DESC
LIMIT 10;
```

To count stored metric records by server:

```sql
SELECT server_id, COUNT(*) AS total_metrics
FROM metrics
GROUP BY server_id;
```

## Validation and Testing

The API uses Zod to validate the structure and data types of incoming metrics, server payloads, alert rules, and query parameters. The TypeScript types are kept aligned with their schemas where applicable.

Tests use Vitest and Fastify's `app.inject()` to exercise endpoints without starting a separate HTTP listener. The current suite contains **39 passing tests across four test files**, covering:

- CPU, memory, disk, stale readings, duration windows, and offline evaluation
- Global and server-specific rule selection, including disabled rules
- Alert creation, resolution, notification calls, and duplicate prevention using mocks
- Health, metrics ingestion and retrieval, and metric-history query validation

Run all tests from the project root:

```bash
npx vitest run
```

The current `server.test.ts` integration tests use the configured agent key and the active database connection. For routine development and CI, move database-dependent tests to an isolated test database or mock persistence so artificial test metrics do not mix with development monitoring data.

## Current Limitations

Sermoni is a learning and portfolio project and is not yet intended for production deployment.

- The dashboard is an initial version: it shows one server at a time and has no date-range selector.
- The dashboard does not yet provide an interface for managing alert rules or browsing alert history; those capabilities are available through the API.
- Alert schema creation is currently a manual setup step; a migration system should manage it in future versions.
- Some read endpoints do not yet require authentication; production deployments need a consistent access-control policy.
- Alert evaluation uses periodic polling rather than push-based metric processing.
- The disk evaluator currently uses the largest reported disk entry in each metric payload rather than independent rules for each filesystem.
- Online/offline dashboard status uses a one-minute window and the browser's clock.
- Servers may be registered manually, and API key issuance requires an existing server record.
- Historical aggregation, retention policies, and advanced metric analytics are not implemented.
- Database-dependent tests should be isolated from development data before use in CI.
- Production deployment, secrets management, access-control review, and operational monitoring still need hardening.

## Future Improvements

- Database migrations for alert tables and future schema changes
- Isolated test database and database-independent integration tests
- Alert-rule management and alert-history views in the dashboard
- Per-filesystem disk rules and additional resource metrics
- Date-range selector and time-based charts in the dashboard
- Historical metric aggregation, retention, and advanced filtering
- Advanced multi-server management, including editing, removing, and grouping servers
- Expanded authentication and authorization for read endpoints
- Agent version reporting and server enrollment workflow
- Real-time dashboard updates with WebSockets or Server-Sent Events
- Docker-based deployment and production security hardening

## Learning Goals

This project is being developed to practice:

- TypeScript and Node.js
- REST API development and HTTP communication between services
- Runtime data validation and authentication
- MySQL integration, SQL queries, and relational modeling with foreign keys
- Docker and containerized development
- Automated unit and integration testing
- System and hardware monitoring
- Alert evaluation, scheduling, and notification delivery
- Modular backend architecture and layered design (routes, services, repositories)
- Frontend development with React and TypeScript
- Data visualization and dashboard design
- Time-zone handling and UTC consistency
- Software design, maintainability, and testability

## License

This project is intended for educational and portfolio purposes. A formal open-source license has not yet been specified.

---

<div align="center">

<a href="https://github.com/chasewright12">
  <img src="https://images.weserv.nl/?url=github.com/chasewright12.png&w=200&h=200&fit=cover&mask=circle" width="150" alt="GitHub profile">
</a>

### Lucas Marques

Brazilian student passionate about programming, computer science, backend development, and systems engineering.

[![GitHub](https://img.shields.io/badge/GitHub-chasewright12-181717?style=flat-square&logo=github)](https://github.com/chasewright12)

[![LinkedIn](https://img.shields.io/badge/LinkedIn-lucasmarquesdev-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/lucasmarquesdev/)

**A Brazilian open-source project.**

If you find the project useful, consider giving it a star!

</div>
