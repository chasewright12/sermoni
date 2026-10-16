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

Sermoni is a server monitoring project designed to collect system metrics and store them in a MySQL database through an HTTP API.

The monitoring agent collects CPU, memory, disk, and system information at regular intervals. The API, built with Fastify, validates incoming payloads using Zod and stores accepted metrics in MySQL for persistent storage and retrieval.

Each metric is linked to the server that sent it. The API identifies servers by hostname, registers new ones automatically, and keeps track of when each one was last seen. A dedicated `servers` module, organized in layers (routes, services, and repositories), handles server registration and management.

A web dashboard built with React, Vite, and Recharts displays the collected data, with a server list, live gauges, and usage charts.

The project is developed with TypeScript and includes modular API routes, automated tests with Vitest, and a Docker Compose configuration for the database.

## Features

- System and hardware information collection
- CPU usage monitoring
- Memory usage monitoring based on available memory, excluding reclaimable cache
- Disk usage monitoring, filtering out virtual filesystems
- Periodic metric collection and HTTP transmission
- REST API built with Fastify
- Runtime request validation with Zod
- Persistent metric storage with MySQL
- JSON payload storage for collected metrics
- Metrics linked to servers through a `server_id` foreign key
- Automatic server registration by hostname
- Server `last_seen` tracking and online/offline status
- Latest metrics retrieval endpoint
- Historical metrics endpoint with date-range and server filters
- Server registration and management endpoints
- Layered `servers` module (routes → services → repositories)
- Configurable CORS origins through environment variables
- UTC timestamps stored and read consistently
- Web dashboard with live gauges, usage charts, and a server list
- API health check endpoint
- Docker Compose configuration for MySQL
- Modular API architecture using routes, schemas, services, and repositories
- Automated API tests with Vitest
- TypeScript-based implementation

## Architecture

```text
┌─────────────────────────────────┐    ┌─────────────────────────────────┐
│         Monitoring Agent        │    │          Web Dashboard          │
│                                 │    │                                 │
│  CPU · Memory · Disk            │    │  React · Vite · Recharts        │
│  System and Hardware Info       │    │  Gauges · Charts · Server list  │
└────────────────┬────────────────┘    └────────────────┬────────────────┘
                 │                                      │
                 │ HTTP POST /metrics                   │ GET /servers
                 │                                      │ GET /metrics/history
                 ▼                                      ▼
┌────────────────┴──────────────────────────────────────┴────────────────┐
│                             Monitoring API                             │
│                                                                        │
│  Fastify + Zod + CORS                                                  │
│                                                                        │
│  Validation and Routing                                                │
│                                                                        │
│  routes/metrics.ts          routes/servers.ts                          │
│          │                          │                                  │
│          └────────────┬─────────────┘                                  │
│                       ▼                                                │
│               servers/services                                         │
│                       │                                                │
│                       ▼                                                │
│             servers/repositories                                       │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     │ INSERT / SELECT / UPDATE
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                               MySQL 8.4                                │
│                                                                        │
│  metrics                                                               │
│  ├── id                                                                │
│  ├── server_id (FK → servers.id)                                       │
│  ├── metric_timestamp                                                  │
│  ├── payload (JSON)                                                    │
│  └── created_at                                                        │
│                                                                        │
│  servers                                                               │
│  ├── id                                                                │
│  ├── hostname (unique)                                                 │
│  ├── operating_system                                                  │
│  ├── agent_version                                                     │
│  ├── created_at                                                        │
│  └── last_seen                                                         │
└────────────────────────────────────────────────────────────────────────┘
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
│   │   ├── routes/
│   │   │   ├── health.ts
│   │   │   ├── metrics.ts
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
│   │   ├── db.ts
│   │   └── server.ts
│   ├── tests/
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
├── .env
├── .gitignore
└── README.md
```

## Technologies

- **TypeScript** — application development and static typing
- **Node.js** — JavaScript runtime
- **Fastify** — HTTP server and routing
- **@fastify/cors** — configurable CORS for the dashboard
- **Zod** — runtime validation of incoming metric and server payloads
- **systeminformation** — system and hardware metrics collection
- **MySQL 8.4** — persistent storage for collected metrics and registered servers
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

The agent runs on the machine being monitored and periodically collects:

- CPU usage
- Total, used, and available memory
- Disk usage for real storage devices
- Operating system information
- Hostname and hardware details
- CPU core count
- System uptime

Memory usage is calculated as total memory minus available memory. This avoids counting the Linux file cache as used memory, which would otherwise keep usage close to 100%. The disk collector ignores virtual filesystems such as `tmpfs`, `squashfs`, and internal system mounts.

The collected data is assembled into a JSON payload and sent to the API using HTTP `POST /metrics`.

### 2. Monitoring API

The API receives metric submissions through:

```http
POST /metrics
```

Before processing a payload, the API validates its structure using the Zod schema defined in `api/src/schemas/metrics.schema.ts`.

- Valid payloads are linked to a server, stored in MySQL, and return HTTP `201 Created` with the `serverId`.
- Invalid payloads return HTTP `400 Bad Request`.
- Database errors return HTTP `500 Internal Server Error`.

The server is identified by the `system.hostname` field of the payload. If no server with that hostname exists yet, it is registered automatically. In every case, the server's `last_seen` value is updated.

### 3. MySQL Persistence

The API stores accepted metric payloads in the `metrics` table.

Each record contains:

- `id` — unique record identifier
- `server_id` — the server that sent the metrics, referencing `servers.id`
- `metric_timestamp` — timestamp supplied by the monitoring agent
- `payload` — collected metrics stored as JSON
- `created_at` — database record creation time

Registered servers are stored in the `servers` table, which contains `id`, `hostname` (unique), `operating_system`, `agent_version`, `created_at`, and `last_seen`.

Unlike in-memory storage, MySQL preserves collected records across API restarts, provided the database volume is retained.

The tables are initialized by the API when it starts, with `servers` created before `metrics` because of the foreign key. If an existing `metrics` table does not have the `server_id` column yet, the API adds it automatically. Metrics stored before this column existed keep a `NULL` `server_id`.

The database connection uses UTC, so timestamps are stored and read consistently regardless of the machine's time zone. The MySQL service and its persistent volume are configured in `docker-compose.yml`.

### 4. Retrieving Metrics

The API exposes the following endpoint:

```http
GET /metrics
```

Local URL: [http://localhost:3000/metrics](http://localhost:3000/metrics)

The endpoint retrieves the latest stored metric payload. The optional `serverId` query parameter returns the latest payload of a specific server. If no metrics have been recorded, it returns HTTP `404 Not Found`.

```bash
curl "http://localhost:3000/metrics?serverId=1"
```

### 5. Retrieving Metric History

To retrieve previously collected metrics, use:

```http
GET /metrics/history
```

Local URL: [http://localhost:3000/metrics/history](http://localhost:3000/metrics/history)

The history endpoint returns stored records from newest to oldest. It supports the following query parameters:

- `limit` — number of records to return. Defaults to `50` and accepts values from `1` to `200`.
- `from` — optional start of the time range, as an ISO 8601 timestamp with a timezone.
- `to` — optional end of the time range, as an ISO 8601 timestamp with a timezone.
- `serverId` — optional server identifier, to return only the records of one server.

For example, retrieve the five most recent records:

```bash
curl "http://localhost:3000/metrics/history?limit=5"
```

Retrieve the most recent records of a specific server:

```bash
curl "http://localhost:3000/metrics/history?serverId=1&limit=5"
```

Or filter records by timestamp:

```bash
curl "http://localhost:3000/metrics/history?from=2026-10-10T07:00:00Z&to=2026-10-10T07:04:00Z"
```

The response includes `count`, the number of records returned; `limit`, the requested limit; and `data`, the array of records. Each record contains its database ID, `server_id`, timestamps, and the original metrics payload. Query values are validated and passed to parameterized SQL queries.

### 6. Servers Module

The API includes a dedicated module for registering and managing monitored servers, exposed through the routes defined in `api/src/routes/servers.ts`:

```http
GET /servers
POST /servers
```

The module is organized in layers, each with a single responsibility:

- **Routes** (`src/routes/servers.ts`) — HTTP layer: receives requests, validates input, and returns responses.
- **Schemas** (`src/servers/schemas/`) — Zod schemas that validate server payloads and parameters.
- **Services** (`src/servers/services/`) — business logic for server operations, including identifying the server that sent a set of metrics.
- **Repositories** (`src/servers/repositories/server.repository.ts`) — database access, using parameterized SQL queries through `mysql2`.
- **Types** (`src/servers/types/`) — TypeScript types shared across the module.

This separation keeps HTTP concerns, business rules, and persistence independent from one another, making the module easier to test and maintain.

Servers can be registered manually or automatically. When metrics arrive from an unknown hostname, the service registers the server using the operating system reported in the payload. Servers created this way have `agent_version` set to `unknown`.

### 7. Web Dashboard

The dashboard, located in `dashboard/`, is a React application built with Vite and Recharts. It reads data from the API every 5 seconds and provides:

- A server list showing each server's status: **Online** (metrics received in the last minute), **Offline** (with the time since it was last seen), or **No data**
- Gauges for CPU, memory, and disk usage, with a status that changes at 70% (warning) and 90% (critical)
- A usage chart with CPU, memory, and disk over time, with series that can be toggled
- A storage panel listing each disk
- A system panel with operating system, architecture, hardware, CPU cores, and uptime
- A selector for the number of readings displayed (30, 60, 120, or 200) and a pause button
- Messages for connection errors, missing servers, and servers without metrics

The dashboard displays one server at a time. It selects the most recently seen server by default, and clicking another server in the list switches the gauges and charts to it.

Local URL: [http://localhost:5173](http://localhost:5173)

### 8. Health Check

The API provides a health check endpoint:

```http
GET /health
```

Local URL: [http://localhost:3000/health](http://localhost:3000/health)

Example response:

```json
{
  "status": "ok"
}
```

This endpoint checks API availability; it should not be interpreted as a complete database health check.

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

From the project root:

```bash
npm install
```

Install the API dependencies separately:

```bash
cd api
npm install
cd ..
```

Install the dashboard dependencies:

```bash
cd dashboard
npm install
cd ..
```

### 3. Configure Environment Variables

Create a `.env` file in the project root. Set your own database credentials:

```dotenv
MYSQL_ROOT_PASSWORD=your_secure_root_password
MYSQL_DATABASE=sermoni
MYSQL_USER=sermoni
MYSQL_PASSWORD=your_secure_database_password
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
CORS_ORIGIN=http://localhost:5173
```

`CORS_ORIGIN` defines which origins may call the API. It accepts multiple origins separated by commas, for example `http://localhost:5173,http://127.0.0.1:5173`. If it is not set, the API allows `http://localhost:5173`.

Replace the example passwords with your own values. Do not commit `.env` or expose database credentials in public repositories.

The dashboard reads the API address from `VITE_API_URL`, which defaults to `http://localhost:3000`. To change it, create `dashboard/.env`:

```dotenv
VITE_API_URL=http://localhost:3000
```

### 4. Start MySQL

From the project root:

```bash
docker compose up -d
```

Check the service status:

```bash
docker compose ps
```

Wait until the MySQL service reports that it is healthy.

The Compose configuration maps MySQL to `127.0.0.1:3306` and uses a named Docker volume to persist database files.

**Important:** MySQL initializes its database and user credentials when the data directory is first created. Changing `.env` later does not automatically change credentials in an existing database volume.

### 5. Start the API

Open a terminal:

```bash
cd ~/projects/server-monitor/api
npm run dev
```

The API initializes the database tables and starts listening on port `3000`.

Verify that the health endpoint responds:

```bash
curl http://localhost:3000/health
```

### 6. Start the Monitoring Agent

Open a second terminal:

```bash
cd ~/projects/server-monitor
npx tsx agent/index.ts
```

The agent collects system metrics and sends them to the API periodically. The first metrics from a new hostname register the server automatically. Keep both the API and the agent running during local monitoring.

### 7. Start the Dashboard

Open a third terminal:

```bash
cd ~/projects/server-monitor/dashboard
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser. Use `localhost` rather than `127.0.0.1`, unless both origins are listed in `CORS_ORIGIN`.

## Running the Project

| Component | Command | Purpose |
|---|---|---|
| MySQL | `docker compose up -d` | Starts the database |
| API | `cd api && npm run dev` | Starts the monitoring API |
| Agent | `npx tsx agent/index.ts` | Collects and submits metrics |
| Dashboard | `cd dashboard && npm run dev` | Starts the web dashboard |
| Tests | `cd api && npm test` | Runs the API test suite |

Run the API, agent, and dashboard in separate terminals. Start MySQL before starting the API.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Checks API availability |
| `POST` | `/metrics` | Validates a metric payload, links it to a server, and stores it |
| `GET` | `/metrics` | Retrieves the latest stored metrics, optionally filtered by `serverId` |
| `GET` | `/metrics/history` | Retrieves historical metrics with optional `limit`, `from`, `to`, and `serverId` filters |
| `GET` | `/servers` | Lists registered servers |
| `POST` | `/servers` | Validates and registers a new server |

## Database Verification

You can inspect the database directly through the MySQL client inside the container:

```bash
docker exec -it sermoni-mysql mysql -u root -p
```

Then run:

```sql
USE sermoni;
SHOW TABLES;
SELECT id, server_id, metric_timestamp, created_at
FROM metrics
ORDER BY id DESC
LIMIT 5;
```

To list registered servers and when they were last seen:

```sql
SELECT id, hostname, operating_system, last_seen
FROM servers;
```

To count stored metric records per server:

```sql
SELECT server_id, COUNT(*) AS total_metrics
FROM metrics
GROUP BY server_id;
```

## Validation

The API uses Zod to validate the expected structure and data types of incoming metrics and server payloads, including:

- System and hardware information
- CPU usage
- Memory statistics
- Disk information
- Timestamp
- Server registration data
- Query parameters such as `limit`, `from`, `to`, and `serverId`

The TypeScript `Metrics` type is inferred from the Zod schema, keeping runtime validation and static typing aligned. The `servers` module follows the same approach, with its schemas and types kept in their own folders.

## Testing

The API uses Vitest and Fastify's `app.inject()` to test HTTP endpoints without requiring a separate HTTP listener.

Run the tests from the API directory:

```bash
cd api
npm test
```

Tests that interact with MySQL require the database and schema to be available, unless the test suite mocks the database dependency. Database-dependent tests should use an isolated test database or a controlled test setup to avoid modifying development data.

Because `POST /metrics` registers unknown hostnames automatically, tests that submit metrics against a real database also create server records, which is another reason to use an isolated test database.

## Current Limitations

Sermoni is a learning and portfolio project, and it is not yet intended for production deployment.

- The dashboard is an initial version: it shows one server at a time and has no date-range selector.
- No authentication between the agent and API is implemented.
- No alerting or notification system is implemented.
- Server management is still basic: there are no endpoints to edit or remove servers, and no server groups.
- Online/offline status uses a one-minute window and the browser's clock.
- Servers registered automatically have their `agent_version` set to `unknown`.
- Metrics stored before servers were linked to them have no `server_id`.
- Historical aggregation and advanced metric analytics are not implemented.
- API access control and production security hardening remain future work.

## Future Improvements

- Date-range selector and time-based charts in the dashboard
- Historical metric aggregation and advanced filtering
- Advanced multi-server management, including editing, removing, and grouping servers
- Agent authentication and API keys
- Agent version reporting
- Configurable resource usage thresholds
- Alerting and notifications
- Real-time updates with WebSockets or Server-Sent Events
- Database migrations and retention policies
- Expanded unit, integration, and database tests
- Docker-based deployment and production security hardening

## Learning Goals

This project is being developed to practice:

- TypeScript and Node.js
- REST API development
- HTTP communication between services
- Runtime data validation
- MySQL integration and SQL queries
- Relational modeling with foreign keys
- Docker and containerized development
- Automated testing
- System and hardware monitoring
- Modular backend architecture
- Layered design (routes, services, repositories)
- Frontend development with React and TypeScript
- Data visualization and dashboard design
- Time zone handling and UTC consistency
- Software design and maintainability

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