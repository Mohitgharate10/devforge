# DevForge

> **A decentralized marketplace for technical Web3 freelance work secured by non-custodial milestone smart-contract escrow.**

[Live Application](https://devforge-web-8bv4.vercel.app/) • [Architecture Guide](docs/ARCHITECTURE.md) • [Product Requirements](docs/PRD.md) • [Roadmap](docs/ROADMAP.md) • [Contributing](CONTRIBUTING.md)

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Monorepo Workspace Layout](#monorepo-workspace-layout)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Database Management](#database-management)
- [Smart Contracts](#smart-contracts)
- [Available Scripts](#available-scripts)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Freelance platforms have traditionally centralized trust, fees, and dispute resolution. Clients worry about paying prior to verifiable delivery, while freelancers face non-payment risks after work completion.

**DevForge** bridges this trust gap by combining the speed and usability of a modern SaaS application with the verifiable safety of decentralized, non-custodial smart contracts:

- **Milestone-Based Escrow**: Funds are locked on-chain in an audited escrow contract when a contract starts and released only upon explicit client approval.
- **AI-Assisted Collaboration**: Natural language project drafting and talent matching that empowers users without overriding financial authorization.
- **Enterprise-Grade Monorepo**: Built using domain-driven design (DDD), type-safe API contracts, and modular services designed to scale independently.

---

## Key Features

| Feature                       | Description                                                                                                                    |
| :---------------------------- | :----------------------------------------------------------------------------------------------------------------------------- |
| **Job Scoping & Posting**     | Clients can publish detailed project specs, required Web3/Web2 skill tags, budgets, and milestone breakdowns.                  |
| **Tailored Proposals**        | Freelancers submit bids with custom milestone estimates, portfolio attachments, and verifiable identity.                       |
| **Non-Custodial Escrow**      | Milestone funds are secured via `DevForgeEscrow.sol`. Funds remain protected with transparent release and refund flows.        |
| **Web3 & Web2 Auth**          | Flexible sign-in supporting credentials (email/password via Argon2) and Web3 wallet address verification (MetaMask / EIP-712). |
| **Project Management**        | Interactive dashboards for clients and freelancers to track project milestones, deliverable submissions, and payouts.          |
| **Collaboration & Messaging** | Realtime updates, deliverable submissions, revisions, and status tracking across the job lifecycle.                            |
| **Dispute & Safety Handling** | Structured dispute escalation workflows and audit logging to protect both parties.                                             |

---

## System Architecture

```mermaid
flowchart TD
    Client["Client / Freelancer (Browser + MetaMask)"]

    subgraph Edge ["Application Boundary"]
        NextWeb["Next.js 16 Web & API Routes (apps/web)"]
        Auth["Better-Auth + Argon2 (Password & Wallet Sign-In)"]
    end

    subgraph Core ["Shared Monorepo Packages"]
        Domain["@devforge/domain (Entities, Use-Cases, Policies)"]
        ApiContracts["@devforge/api-contracts (Zod Schemas & DTOs)"]
        DbPackage["@devforge/database (Prisma Client & Repositories)"]
        Observability["@devforge/observability (Structured Logging & Telemetry)"]
    end

    subgraph Storage ["Data & Cache Layer"]
        Postgres[("PostgreSQL 16")]
        RedisCache[("Redis Store & Queues")]
    end

    subgraph Blockchain ["On-Chain Layer"]
        Hardhat["Hardhat Runtime / EVM"]
        EscrowContract["DevForgeEscrow.sol (Non-custodial Escrow)"]
    end

    Client -->|HTTPS / REST / Server Actions| NextWeb
    Client -->|EIP-712 / Wallet Signature| NextWeb
    Client -.->|Direct Escrow Interactions| EscrowContract
    NextWeb --> Auth
    NextWeb --> ApiContracts
    NextWeb --> Domain
    Domain --> DbPackage
    DbPackage --> Postgres
    NextWeb --> RedisCache
    Hardhat --> EscrowContract
```

---

## Monorepo Workspace Layout

DevForge is organized as a modular pnpm monorepo:

```text
devforge/
├── apps/
│   └── web/                   # Next.js 16 App Router application and REST API endpoints
├── packages/
│   ├── api-contracts/         # Versioned Zod request/response schemas and DTO types
│   ├── config/                # Shared ESLint, Prettier, and TypeScript configurations
│   ├── contracts/             # Solidity smart contracts (Hardhat, TypeChain, DevForgeEscrow.sol)
│   ├── database/              # Prisma schema, migrations, seeders, and repository adapters
│   ├── domain/                # Framework-agnostic entities, value objects, and business policies
│   └── observability/         # Logging, telemetry, and monitoring adapters
├── docker/
│   └── compose.yml            # Local PostgreSQL and Redis container infrastructure
├── docs/                      # Architectural decisions, PRD, and roadmaps
├── .env.example               # Root environment configuration template
├── pnpm-workspace.yaml        # Workspace configuration
└── package.json               # Root monorepo scripts
```

---

## Tech Stack

### Frontend & Application Layer

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Components)
- **UI & Styling**: [React 19](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), Radix UI
- **Type Safety**: [TypeScript 5.9](https://www.typescriptlang.org/), [Zod 4](https://zod.dev/)

### Backend & Persistence

- **Runtime**: [Node.js 22+](https://nodejs.org/)
- **Database**: [PostgreSQL 16](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)
- **Caching & Queues**: [Redis](https://redis.io/)
- **Authentication**: [Better-Auth](https://better-auth.com/) with [@node-rs/argon2](https://github.com/napi-rs/node-rs) password hashing and Web3 wallet linking

### Blockchain & Smart Contracts

- **Smart Contract Language**: [Solidity 0.8+](https://soliditylang.org/)
- **Development Toolchain**: [Hardhat](https://hardhat.org/) & [TypeChain](https://github.com/dethcrypto/TypeChain)
- **Contract Interface**: `DevForgeEscrow.sol` for milestone locking, release, and resolution

### Quality & Tooling

- **Package Manager**: [pnpm 11](https://pnpm.io/)
- **Testing**: [Vitest](https://vitest.dev/) with V8 coverage
- **Linting & Formatting**: ESLint 9 (Flat config) & Prettier

---

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) `>= 22.0.0`
- [pnpm](https://pnpm.io/) `>= 11.0.0`
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for local PostgreSQL & Redis)
- [Git](https://git-scm.com/)

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Mohitgharate10/devforge.git
cd devforge
```

### 2. Configure environment variables

Copy the example environment configuration:

```bash
cp .env.example .env.local
```

Edit `.env.local` to configure your database URL, session secrets, and wallet settings.

### 3. Start local dependencies

Spin up PostgreSQL and Redis using Docker Compose:

```bash
docker compose -f docker/compose.yml up -d
```

### 4. Install dependencies

```bash
pnpm install
```

### 5. Run database migrations and seed data

```bash
pnpm db:migrate:dev
pnpm db:seed
```

### 6. Start the development server

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.  
Check service readiness at [http://localhost:3000/api/v1/health](http://localhost:3000/api/v1/health).

---

## Environment Configuration

Create a `.env.local` file in the root directory based on `.env.example`:

| Variable               | Description                          | Example Value                                                          |
| :--------------------- | :----------------------------------- | :--------------------------------------------------------------------- |
| `DATABASE_URL`         | PostgreSQL connection string         | `postgresql://postgres:postgres@localhost:5432/devforge?schema=public` |
| `REDIS_URL`            | Redis instance URL                   | `redis://localhost:6379`                                               |
| `BETTER_AUTH_SECRET`   | Secret key for auth token signing    | `your-secure-random-32-byte-string`                                    |
| `BETTER_AUTH_URL`      | Base application URL                 | `http://localhost:3000`                                                |
| `NEXT_PUBLIC_APP_URL`  | Client application URL               | `http://localhost:3000`                                                |
| `NEXT_PUBLIC_CHAIN_ID` | EVM network chain ID (e.g., Sepolia) | `11155111`                                                             |

---

## Database Management

DevForge uses Prisma ORM inside the `@devforge/database` package:

```bash
# Generate Prisma Client
pnpm db:generate

# Run development migrations
pnpm db:migrate:dev

# Apply migrations in production
pnpm db:migrate:deploy

# Open interactive Prisma Studio GUI
pnpm db:studio

# Seed sample jobs, profiles, and milestones
pnpm db:seed
```

---

## Smart Contracts

The smart contracts package is located at `packages/contracts`:

```bash
# Compile contracts and generate TypeScript types
pnpm --filter @devforge/contracts compile

# Run Hardhat smart contract tests
pnpm --filter @devforge/contracts test

# Deploy escrow contract locally or to testnet
pnpm --filter @devforge/contracts deploy
```

---

## Available Scripts

| Command              | Action                                                                      |
| :------------------- | :-------------------------------------------------------------------------- |
| `pnpm dev`           | Starts the Next.js web application in development mode with hot reloading   |
| `pnpm build`         | Compiles production build of the web application and all workspace packages |
| `pnpm check`         | Runs full quality suite: code formatting, linting, type-checking, and tests |
| `pnpm test`          | Runs unit tests across all monorepo packages                                |
| `pnpm test:coverage` | Generates detailed unit test coverage report                                |
| `pnpm lint`          | Runs ESLint across all workspaces                                           |
| `pnpm typecheck`     | Validates TypeScript types across the entire project                        |
| `pnpm format`        | Formats all files with Prettier                                             |
| `pnpm format:check`  | Checks formatting without modifying files                                   |

---

## Contributing

Contributions, issues, and feature requests are welcome. Please read our [Contributing Guide](CONTRIBUTING.md) for details on code style, branch conventions, and the pull request process.

---

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for more information.

---

<p align="center">
  Maintained by <a href="https://github.com/Mohitgharate10">Mohit Gharate</a>
</p>
