 <div align="center">

<img src="https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExY3J3NGZyODlyZ3AwMzF5dGN0ZmFqcGd5c2JtY3ZoMjRydGowaDE2aCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/LGzrggUppEBdm/giphy.gif" alt="Sermoni animation">

# Sermoni by ChaseWright | Server Monitoring

**A lightweight server monitoring system built with TypeScript.**

</div>

Sermoni is a server monitoring project designed to collect system metrics from a machine and send them to a monitoring API over HTTP.

The monitoring agent collects CPU, memory, disk, and system information. The API, built with Fastify, validates incoming data using Zod and exposes HTTP endpoints for health checks and metric retrieval.

The API is organized into separate route and schema modules, with automated endpoint tests powered by Vitest.

<div align="center">

## Features

</div>

- System and hardware information collection
- CPU usage monitoring
- Memory usage monitoring
- Disk usage monitoring
- HTTP communication between the monitoring agent and API
- Runtime request validation with Zod
- Modular API architecture using routes and schemas
- Health check endpoint
- Latest metrics retrieval endpoint
- In-memory storage of the latest metrics
- Automated API endpoint tests with Vitest
- TypeScript-based implementation
- Fastify HTTP server

## Architecture

```text
┌──────────────────────────┐
│     Monitoring Agent     │
│                          │
│  CPU                     │
│  Memory                  │
│  Disk                    │
│  System Information      │
└────────────┬─────────────┘
             │
             │ HTTP POST /metrics
             ▼
┌──────────────────────────┐
│      Monitoring API      │
│                          │
│        Fastify           │
│           +              │
│          Zod             │
│                          │
│   Routes and Schemas     │
└────────────┬─────────────┘
             │
             │ GET /metrics
             ▼
┌──────────────────────────┐
│     Client / Browser     │
└──────────────────────────┘
```

## Project Structure

```text
server-monitor/
│
├── agent/
│   ├── src/
│   │   └── collectors/
│   │       ├── cpu.ts
│   │       ├── memory.ts
│   │       ├── disk.ts
│   │       └── system.ts
│   │
│   ├── api.ts
│   └── index.ts
│
├── api/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── health.ts
│   │   │   └── metrics.ts
│   │   │
│   │   ├── schemas/
│   │   │   └── metrics.schema.ts
│   │   │
│   │   └── server.ts
│   │
│   ├── tests/
│   │   └── server.test.ts
│   │
│   ├── package.json
│   └── package-lock.json
│
├── docker-compose.yml
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

## Technologies

- **TypeScript** — application development and static typing
- **Node.js** — JavaScript runtime environment
- **Fastify** — HTTP server and routing
- **Zod** — runtime validation of incoming metric payloads
- **systeminformation** — system and hardware metrics collection
- **tsx** — TypeScript execution during development
- **Vitest** — automated testing

## How It Works

### 1. Monitoring Agent

The monitoring agent runs on the machine being monitored.

It collects:

- CPU usage
- Memory usage
- Disk usage
- Operating system information
- Hostname
- Hardware information
- CPU core count
- System uptime

The agent periodically collects system metrics and sends the resulting payload to the monitoring API over HTTP.

Example payload:

```json
{
  "system": {
    "hostname": "example-server",
    "operatingSystem": {
      "platform": "linux",
      "distro": "Ubuntu",
      "release": "24.04",
      "arch": "x64"
    },
    "hardware": {
      "manufacturer": "Microsoft",
      "model": "WSL"
    },
    "uptime": 47730.78,
    "cpu": {
      "cores": 8
    }
  },
  "cpu": 35.5,
  "memory": {
    "total": 4011458560,
    "used": 3083448320,
    "free": 928010240,
    "percentage": 76.86
  },
  "disk": [
    {
      "filesystem": "/dev/sdd",
      "size": 1081101176832,
      "used": 7002083328,
      "percentage": 0.68
    }
  ],
  "timestamp": "2026-10-07T20:01:27.819Z"
}
```

The payload is illustrative. Actual metric values depend on the monitored machine and collection time.

### 2. Monitoring API

The API receives metric payloads through:

```http
POST /metrics
```

Before accepting the data, the API validates the request body against a Zod schema.

- Valid metric submissions return HTTP `201 Created`.
- Invalid payloads return HTTP `400 Bad Request`.
- Accepted metrics become the latest metrics available through the API.

The validation schema is defined in `api/src/schemas/metrics.schema.ts`.

### 3. Retrieving Metrics

The latest metrics can be retrieved through:

```http
GET /metrics
```

Local endpoint:

http://localhost:3000/metrics

The endpoint returns the latest accepted metrics. If no metrics have been received yet, it returns HTTP `404 Not Found`.

### 4. Health Check

The API exposes a health check endpoint:

```http
GET /health
```

Local endpoint:

http://localhost:3000/health

Example response:

```json
{
  "status": "ok"
}
```

### 5. Modular API Architecture

The API separates HTTP routing, data validation, and server initialization.

- `routes/health.ts` defines the health check endpoint.
- `routes/metrics.ts` handles metric submissions and retrieval.
- `schemas/metrics.schema.ts` defines the Zod schema and inferred TypeScript type.
- `server.ts` creates the Fastify instance, registers the routes, and starts the server.

This structure makes the application easier to maintain, test, and extend as new features are introduced.

## Installation

Clone the repository:

```bash
git clone https://github.com/rootmannwright/server-monitor.git
cd server-monitor
```

### Agent

Open a terminal and navigate to the agent directory:

```bash
cd agent
npm install
```

Run the agent:

```bash
npx tsx index.ts
```

### API

Open another terminal and navigate to the API directory:

```bash
cd api
npm install
```

Start the API:

```bash
npx tsx src/server.ts
```

The API will be available at:

http://localhost:3000

> Start the API before running the monitoring agent. Ensure that the agent's configured API URL matches the address where the API is running.

## Running the Project

### Terminal 1 — API

```bash
cd api
npx tsx src/server.ts
```

### Terminal 2 — Agent

```bash
cd agent
npx tsx index.ts
```

Once both components are running, the agent periodically sends metrics to the API.

You can check the API health at:

http://localhost:3000/health

Retrieve the latest metrics at:

http://localhost:3000/metrics

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/metrics` | Validate and receive monitoring metrics |
| `GET` | `/metrics` | Retrieve the latest accepted metrics |
| `GET` | `/health` | Check API health |

## Validation

The API uses Zod to validate incoming metric payloads at runtime.

The schema checks the expected structure and data types for:

- System information
- CPU usage
- Memory information
- Disk information
- Timestamp

The TypeScript `Metrics` type is inferred from the Zod schema, reducing duplication between runtime validation and static typing.

Invalid payloads are rejected with HTTP `400`. Valid payloads are accepted with HTTP `201`.

## Testing

The API uses Vitest and Fastify's `app.inject()` method to test endpoints without starting a separate HTTP server.

The current test suite covers four scenarios:

- `GET /health` returns HTTP `200` and the expected status.
- `POST /metrics` accepts a valid payload and returns HTTP `201`.
- `POST /metrics` rejects an invalid payload with HTTP `400`.
- `GET /metrics` returns previously accepted metrics.

Run the tests from the API directory:

```bash
cd api
npm test
```

These tests help verify endpoint behavior and catch regressions when the API is modified.

## Current Limitations

Sermoni is currently a learning and development project.

- Metrics are stored only in memory.
- Only the latest accepted metric payload is retained.
- Restarting the API clears the stored metrics.
- Historical metric queries are not available.
- There is no authentication between the agent and API.
- There is no web dashboard yet.
- There is no alerting system yet.
- Multiple-server registration and management are not implemented.
- Production deployment and security hardening remain future work.

## Future Improvements

Planned areas for further development include:

- MySQL integration for persistent metric storage
- Historical metric queries and aggregation
- Multiple monitored servers
- Server registration and identification
- Authentication between agents and API
- API keys and access control
- CPU, memory, and disk usage thresholds
- Alerting and notifications
- Web dashboard with historical charts
- Real-time updates with WebSockets
- Docker-based development and deployment
- Automated testing for additional scenarios
- Production deployment and security hardening

## Learning Goals

This project is being developed to practice:

- TypeScript and Node.js
- REST API development
- HTTP communication
- Runtime data validation
- Automated testing
- Relational database integration
- System monitoring
- Modular API architecture
- Linux system information
- Backend development
- Software design and maintainability

## License

This project is intended for educational and portfolio purposes. A formal license has not yet been specified.

---

<div align="center">


<a href="https://github.com/chasewright12">
  <img src="https://images.weserv.nl/?url=github.com/chasewright12.png&w=200&h=200&fit=cover&mask=circle" width="150" alt="Lucas" />
</a>

### Lucas Marques

Brazilian student passionate about programming and computer science.
I build software on the side and I'm learning how computers work by creating this emulator from scratch.

[![GitHub](https://img.shields.io/badge/GitHub-chasewright12-181717?style=flat-square&logo=github)](https://github.com/chasewright12)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-lucasmarquesdev-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/lucasmarquesdev/)


**A Brazilian open-source project**. 
If you like the project or learned something from it, consider giving it a star!

</div>