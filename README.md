<div align="center">

<img src="https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExc2drNThsb3c3bzh4aHdldWwyZXZtZmNkZzU1cmszM3UxNXlpMDM4dyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Zx1KzuQBR8wIbrm81t/giphy.gif">
<br>
<p align="center">
  Image: <strong>CISCO Latinoamérica</strong> • @ciscolatinoamerica
</p>

# Sermoni by ChaseWright | Server Monitoring
</div>

Sermoni is a lightweight server monitoring system built with **TypeScript**.

The project consists of an agent that collects system metrics from a machine and sends them to a monitoring API over HTTP. The API validates the received data using **Zod** and exposes the latest metrics through a REST endpoint.

## Features

- System information collection
- CPU usage monitoring
- Memory usage monitoring
- Disk usage monitoring
- HTTP communication between Agent and API
- Runtime data validation with Zod
- Health check endpoint
- Latest metrics endpoint
- TypeScript-based implementation
- Fastify HTTP server

## Architecture

```text
┌─────────────────────┐
│    Monitoring       │
│       Agent         │
│                     │
│  CPU                │
│  Memory             │
│  Disk               │
│  System Information │
└──────────┬──────────┘
           │
           │ HTTP POST /metrics
           ▼
┌─────────────────────┐
│   Monitoring API    │
│                     │
│      Fastify        │
│        +            │
│       Zod           │
└──────────┬──────────┘
           │
           │ GET /metrics
           ▼
       ┌───────┐
       │Client │
       │Browser│
       └───────┘
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
│   └── src/
│       └── server.ts
│
└── README.md
```

## Technologies

- **TypeScript** — application development
- **Node.js** — runtime environment
- **Fastify** — HTTP server
- **Zod** — request validation
- **systeminformation** — system and hardware metrics
- **tsx** — TypeScript execution during development

## How It Works

### 1. Agent

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

The agent periodically collects the metrics and sends them to the API.

Example payload:

```json
{
  "system": {
    "hostname": "rootmannwright",
    "operatingSystem": {
      "platform": "linux",
      "distro": "Ubuntu",
      "release": "26.04.1 LTS",
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
  "cpu": 1.85,
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

### 2. Monitoring API

The API receives the metrics through:

```http
POST /metrics
```

Before accepting the data, the API validates the request body against a Zod schema.

Invalid requests are rejected with HTTP `400`.

Successful metric submissions return HTTP `201`.

The API also keeps the latest received metrics in memory.

### 3. Retrieving Metrics

The latest metrics can be retrieved through:

```http
GET /metrics
```

For example:

```text
http://localhost:3000/metrics
```

The endpoint returns the latest metrics received from the monitoring agent.

### 4. Health Check

The API provides a health check endpoint:

```http
GET /health
```

Example response:

```json
{
  "status": "ok"
}
```

## Installation

Clone the repository:

```bash
git clone https://github.com/rootmannwright/server-monitor.git
cd server-monitor
```

### Agent

Navigate to the agent directory:

```bash
cd agent
```

Install dependencies:

```bash
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
```

Install dependencies:

```bash
npm install
```

Start the API:

```bash
npx tsx src/server.ts
```

The API will start on:

```text
http://localhost:3000
```

## Running the Project

The API should be started before the Agent.

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

Once both components are running, the Agent periodically sends metrics to the API.

You can then access:

```text
http://localhost:3000/health
```

and:

```text
http://localhost:3000/metrics
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/metrics` | Receive monitoring metrics |
| `GET` | `/metrics` | Retrieve the latest metrics |
| `GET` | `/health` | Check API health |

## Validation

The API uses Zod to validate incoming metrics.

The validation layer ensures that the received data contains the expected structure for:

- System information
- CPU usage
- Memory usage
- Disk information
- Timestamp

This prevents malformed data from being accepted by the API.

## Current Limitations

The project is currently designed as a learning and development project.

At the moment:

- Metrics are stored only in memory.
- Historical metrics are not persisted.
- Restarting the API clears the latest metrics.
- There is no authentication between the Agent and API.
- There is no web dashboard yet.
- There are no alerting mechanisms yet.
- The API currently monitors the latest received state rather than maintaining historical server data.

## Future Improvements

Possible future features include:

- PostgreSQL metric storage
- Historical metric queries
- Multiple monitored servers
- Server registration
- Authentication between agents and API
- API keys
- Metric aggregation
- Alerting system
- CPU, memory and disk thresholds
- Web dashboard
- Real-time updates with WebSockets
- Docker support
- Redis integration
- Automated tests
- Production deployment

## Learning Goals

This project is being developed to practice:

- TypeScript
- REST API development
- HTTP communication
- Runtime validation
- System monitoring
- API architecture
- Backend development
- Linux system information
- Modular application design

## License

This project is intended for educational and portfolio purposes.

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