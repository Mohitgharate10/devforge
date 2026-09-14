# DevForge

DevForge is a decentralized freelance marketplace built as a production-oriented TypeScript monorepo.

## Prerequisites

- Node.js 22 or newer
- pnpm 11 or newer
- Docker Desktop (for PostgreSQL and Redis)

## Local development

1. Copy `.env.example` to `.env.local`.
2. Start local dependencies: `docker compose -f docker/compose.yml up -d`.
3. Install dependencies: `pnpm install`.
4. Start the web application: `pnpm dev`.
5. Verify service readiness at `http://localhost:3000/api/v1/health`.

## Quality commands

- `pnpm check` — formatting, linting, type checking, and unit tests.
- `pnpm build` — production build of the web application.
- `pnpm test:coverage` — unit test coverage report.

See [docs/ROADMAP.md](docs/ROADMAP.md) for delivery phases and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for system design.
