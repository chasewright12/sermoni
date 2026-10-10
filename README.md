# Sermoni — Server Monitoring

<div align="center">

<img src="https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExY3J3NGZyODlyZ3AwMzF5dGN0ZmFqcGd5c2JtY3ZoMjRydGowaDE2aCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/LGzrggUppEBdm/giphy.gif" alt="Sermoni animation">

**A lightweight server monitoring system built with TypeScript.**

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-000000?style=flat-square&logo=fastify&logoColor=white)](https://fastify.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=flat-square&logo=vitest&logoColor=white)](https://vitest.dev/)

</div>

Sermoni is a server monitoring project designed to collect system metrics and store them in a MySQL database through an HTTP API.

The monitoring agent collects CPU, memory, disk, and system information at regular intervals. The API, built with Fastify, validates incoming payloads using Zod and stores accepted metrics in MySQL for persistent storage and retrieval.

The project is developed with TypeScript and includes modular API routes, automated tests with Vitest, and a Docker Compose configuration for the database.

## Features

- System and hardware information collection
- CPU usage monitoring
- Memory usage monitoring
- Disk usage monitoring
- Periodic metric collection and HTTP transmission
- REST API built with Fastify
- Runtime request validation with Zod
- Persistent metric storage with MySQL
- JSON payload storage for collected metrics
- Latest metrics retrieval endpoint
- API health check endpoint
- Docker Compose configuration for MySQL
- Modular API architecture using routes and schemas
- Automated API tests with Vitest
- TypeScript-based implementation

## Architecture

```text
┌─────────────────────────────┐
│       Monitoring Agent      │
│                             │
│  CPU · Memory · Disk        │
│  System and Hardware Info   │
└──────────────┬──────────────┘
               │
               │ HTTP POST /metrics
               ▼
┌─────────────────────────────┐
│        Monitoring API       │
│                             │
│          Fastify            │
│             +               │
│            Zod              │
│                             │
│  Validation and Routing     │
└──────────────┬──────────────┘
               │
               │ INSERT / SELECT
               ▼
┌─────────────────────────────┐
│         MySQL 8.4           │
│                             │
│  metrics                    │
│  ├── id                     │
│  ├── metric_timestamp       │
│  ├── payload (JSON)         │
│  └── created_at             │
└─────────────────────────────┘
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
│   │   │   └── metrics.ts
│   │   ├── schemas/
│   │   │   └── metrics.schema.ts
│   │   ├── db.ts
│   │   └── server.ts
│   ├── tests/
│   │   └── server.test.ts
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
- **Zod** — runtime validation of incoming metric payloads
- **systeminformation** — system and hardware metrics collection
- **MySQL 8.4** — persistent storage for collected metrics
- **mysql2** — MySQL client for Node.js
- **Docker Compose** — local database setup and management
- **tsx** — TypeScript execution during development
- **Vitest** — automated testing

## How It Works

### 1. Monitoring Agent

The agent runs on the machine being monitored and periodically collects:

- CPU usage
- Total, used, and free memory
- Disk usage
- Operating system information
- Hostname and hardware details
- CPU core count
- System uptime

The collected data is assembled into a JSON payload and sent to the API using HTTP `POST /metrics`.

### 2. Monitoring API

The API receives metric submissions through:

```http
POST /metrics
```

Before processing a payload, the API validates its structure using the Zod schema defined in `api/src/schemas/metrics.schema.ts`.

- Valid payloads are stored in MySQL and return HTTP `201 Created`.
- Invalid payloads return HTTP `400 Bad Request`.
- Database errors return HTTP `500 Internal Server Error`.

### 3. MySQL Persistence

The API stores accepted metric payloads in the `metrics` table.

Each record contains:

- `id` — unique record identifier
- `metric_timestamp` — timestamp supplied by the monitoring agent
- `payload` — collected metrics stored as JSON
- `created_at` — database record creation time

Unlike in-memory storage, MySQL preserves collected records across API restarts, provided the database volume is retained.

The table is initialized by the API when it starts. The MySQL service and its persistent volume are configured in `docker-compose.yml`.

### 4. Retrieving Metrics

The API exposes the following endpoint:

```http
GET /metrics
```

Local URL: [http://localhost:3000/metrics](http://localhost:3000/metrics)

The endpoint retrieves the latest stored metric payload. If no metrics have been recorded, it returns HTTP `404 Not Found`.

### 5. Health Check

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

### 2. Install Root Dependencies

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

### 3. Configure Environment Variables

Create a `.env` file in the project root. Set your own database credentials:

```dotenv
MYSQL_ROOT_PASSWORD=your_secure_root_password
MYSQL_DATABASE=sermoni
MYSQL_USER=sermoni
MYSQL_PASSWORD=your_secure_database_password

MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
```

Replace the example passwords with your own values. Do not commit `.env` or expose database credentials in public repositories.

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

The API initializes the `metrics` table and starts listening on port `3000`.

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

The agent collects system metrics and sends them to the API periodically. Keep both the API and the agent running during local monitoring.

## Running the Project

| Component | Command | Purpose |
|---|---|---|
| MySQL | `docker compose up -d` | Starts the database |
| API | `cd api && npm run dev` | Starts the monitoring API |
| Agent | `npx tsx agent/index.ts` | Collects and submits metrics |
| Tests | `cd api && npm test` | Runs the API test suite |

Run the API and agent in separate terminals. Start MySQL before starting the API.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Checks API availability |
| `POST` | `/metrics` | Validates and stores a metric payload |
| `GET` | `/metrics` | Retrieves the latest stored metrics |

## Database Verification

You can inspect the database directly through the MySQL client inside the container:

```bash
docker exec -it sermoni-mysql mysql -u root -p
```

Then run:

```sql
USE sermoni;

SHOW TABLES;

SELECT id, metric_timestamp, created_at
FROM metrics
ORDER BY id DESC
LIMIT 5;
```

To count stored metric records:

```sql
SELECT COUNT(*) AS total_metrics
FROM metrics;
```

## Validation

The API uses Zod to validate the expected structure and data types of incoming metrics, including:

- System and hardware information
- CPU usage
- Memory statistics
- Disk information
- Timestamp

The TypeScript `Metrics` type is inferred from the Zod schema, keeping runtime validation and static typing aligned.

## Testing

The API uses Vitest and Fastify's `app.inject()` to test HTTP endpoints without requiring a separate HTTP listener.

Run the tests from the API directory:

```bash
cd api
npm test
```

Tests that interact with MySQL require the database and schema to be available, unless the test suite mocks the database dependency. Database-dependent tests should use an isolated test database or a controlled test setup to avoid modifying development data.

## Current Limitations

Sermoni is a learning and portfolio project, and it is not yet intended for production deployment.

- No web dashboard is available yet.
- No authentication between the agent and API is implemented.
- No alerting or notification system is implemented.
- Multi-server registration and management are not implemented.
- Historical aggregation and advanced metric queries are not implemented.
- API access control and production security hardening remain future work.
- The current API endpoint returns the latest stored metric payload rather than a complete historical dataset.

## Future Improvements

- Web dashboard with CPU, memory, and disk charts
- Historical metric queries and aggregation
- Multiple-server registration and management
- Agent authentication and API keys
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
- Docker and containerized development
- Automated testing
- System and hardware monitoring
- Modular backend architecture
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
