# Contributing to DevForge

Thanks for helping improve DevForge. Contributions to code, tests, documentation, accessibility, and product design are welcome.

## Before you start

- Search [existing issues](https://github.com/Mohitgharate10/devforge/issues) before opening a new one.
- For large features or changes to escrow behavior, open an issue first to agree on scope.
- Do not include credentials, private keys, personal data, or production wallet details in issues, commits, or pull requests.

## Local setup

```bash
git clone https://github.com/<your-username>/devforge.git
cd devforge
cp .env.example .env.local
docker compose -f docker/compose.yml up -d
pnpm install
pnpm db:migrate:dev
pnpm dev
```

Use Node.js 22+ and pnpm 11+. See the [README](README.md) for environment details and database commands.

## Project boundaries

| Area | Responsibility |
| --- | --- |
| `apps/web` | UI, route handlers, server actions, and application composition |
| `packages/domain` | Entities, value objects, policies, and ports; no framework dependencies |
| `packages/api-contracts` | Zod schemas and request/response contracts |
| `packages/database` | Prisma schema, migrations, and persistence adapters |
| `packages/contracts` | Solidity contracts, Hardhat configuration, and contract tests |

Keep dependencies one-way. In particular, domain code must not depend on Next.js, Prisma, or HTTP libraries.

## Workflow

1. Create a focused branch from `main`, for example `feat/milestone-notifications` or `fix/wallet-reconnect`.
2. Make the smallest complete change and include tests when behavior changes.
3. Run the full quality suite:

   ```bash
   pnpm check
   ```

4. Use Conventional Commit-style messages:

   ```text
   feat(escrow): add refund deadline validation
   fix(auth): handle wallet reconnection
   docs(readme): clarify local setup
   ```

5. Open a pull request with a concise summary, test evidence, relevant screenshots for UI changes, and linked issues where applicable.

## Smart-contract changes

Changes under `packages/contracts` need targeted tests for every modified public or external function. Document the intended state transitions and test failure paths as well as happy paths. Never claim a contract is audited unless a completed independent audit is linked.

## Reporting security concerns

Do not open public issues for suspected vulnerabilities, exposed secrets, authentication bypasses, or payment/escrow flaws. Contact the repository owner privately with a minimal reproduction and impact summary.

Thank you for contributing.
