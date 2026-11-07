# DevForge

> A decentralized marketplace for technical freelance work, with non-custodial milestone escrow.

[Live application](https://devforge-web-8bv4.vercel.app/) · [Architecture](docs/ARCHITECTURE.md) · [Product requirements](docs/PRD.md) · [Roadmap](docs/ROADMAP.md) · [Contributing](CONTRIBUTING.md)

## What it does

DevForge helps clients and freelancers define work, agree milestones, and track delivery. It combines a modern web application with EVM-compatible escrow contracts so that milestones can be funded, reviewed, released, or resolved through defined flows.

- Create jobs, proposals, milestones, and deliverable submissions.
- Use credential and wallet-based authentication.
- Manage project progress, messages, and disputes in role-specific dashboards.
- Lock milestone funds through the `DevForgeEscrow.sol` contract.

> **Security note:** Smart-contract code is not a substitute for an independent audit. Do not use real funds until the contracts have been reviewed, tested on the intended network, and deployed with production-safe configuration.

## Architecture

```text
apps/web                 Next.js application, UI, route handlers, and API
packages/domain          Framework-independent business rules
packages/api-contracts   Shared Zod schemas and DTOs
packages/database        Prisma schema, migrations, and repositories
packages/contracts       Solidity contracts, Hardhat, and TypeChain
packages/observability   Logging and telemetry adapters
docker/compose.yml       Local PostgreSQL and Redis
```

The application follows one-way dependencies: the web application can consume shared packages; domain logic must remain independent of Next.js, Prisma, and transport concerns. See the [architecture guide](docs/ARCHITECTURE.md) for design details.

## Stack

- **Application:** Next.js 16, React 19, TypeScript, Tailwind CSS, Radix UI
- **Data:** PostgreSQL 16, Prisma, Redis
- **Identity:** Better Auth, Argon2, EIP-712 wallet verification
- **Contracts:** Solidity, Hardhat, TypeChain
- **Tooling:** pnpm 11, Vitest, ESLint, Prettier

## Local development

### Prerequisites

- Node.js 22+
- pnpm 11+
- Docker Desktop
- Git

### Setup

```bash
git clone https://github.com/Mohitgharate10/devforge.git
cd devforge
cp .env.example .env.local
docker compose -f docker/compose.yml up -d
pnpm install
pnpm db:migrate:dev
pnpm db:seed
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The health endpoint is available at `/api/v1/health`.

Never commit `.env.local`. Replace all development secrets before deployment, and configure optional OAuth values only when the relevant provider is enabled.

## Common commands

| Command                                  | Purpose                                  |
| ---------------------------------------- | ---------------------------------------- |
| `pnpm dev`                               | Run the web application locally          |
| `pnpm build`                             | Build the web app and workspace packages |
| `pnpm check`                             | Run format, lint, type, and test checks  |
| `pnpm test`                              | Run workspace tests                      |
| `pnpm lint` / `pnpm typecheck`           | Run static checks                        |
| `pnpm db:migrate:dev`                    | Create and apply development migrations  |
| `pnpm db:migrate:deploy`                 | Apply production migrations              |
| `pnpm db:seed`                           | Seed local development data              |
| `pnpm --filter @devforge/contracts test` | Run contract tests                       |

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening an issue or pull request. For meaningful changes, include tests and run `pnpm check` locally.

## License

Licensed under the [MIT License](LICENSE).
