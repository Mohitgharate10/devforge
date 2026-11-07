# Contributing to DevForge

Thank you for your interest in contributing to **DevForge**! We are building a secure, decentralized freelance marketplace and appreciate contributions of all kinds — bug fixes, documentation, new features, and design improvements.

---

## 📜 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Monorepo Architecture Guidelines](#monorepo-architecture-guidelines)
- [Git Commit Guidelines](#git-commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)

---

## 🤝 Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free environment for everyone. Please be respectful, considerate, and constructive in all interactions.

---

## 💡 How Can I Contribute?

### 1. Reporting Bugs
- Search existing [GitHub Issues](https://github.com/Mohitgharate10/devforge/issues) to ensure the issue hasn't already been reported.
- Open a new issue with a descriptive title.
- Provide a clear summary, steps to reproduce, expected behavior, and relevant logs or screenshots.
- Mention your environment (Node version, OS, browser, wallet provider).

### 2. Suggesting Enhancements
- Open a feature request issue explaining the motivation and proposed solution.
- Outline user impact and any architectural implications.

### 3. Submitting Pull Requests
- PRs can address bug fixes, enhancements, or documentation updates.
- Please discuss significant changes in an issue before starting work.

---

## 🛠️ Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/<your-username>/devforge.git
   cd devforge
   ```

2. **Branching Strategy**
   Always create a new branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```

3. **Install Dependencies**
   Make sure you have Node.js `>= 22` and pnpm `>= 11`:
   ```bash
   pnpm install
   ```

4. **Environment Configuration**
   ```bash
   cp .env.example .env.local
   # Update your .env.local values
   ```

5. **Start Infrastructure Services**
   ```bash
   docker compose -f docker/compose.yml up -d
   ```

6. **Run Database Migrations**
   ```bash
   pnpm db:migrate:dev
   ```

7. **Start Dev Server**
   ```bash
   pnpm dev
   ```

---

## 🏛️ Monorepo Architecture Guidelines

DevForge follows clean architecture and modular monolith principles:

- **`apps/web`**: Contains Next.js 16 pages, route handlers, server actions, and UI layouts. Do not put domain business logic here.
- **`packages/domain`**: Contains entities, value objects, domain policies, and interfaces. This package has zero external framework dependencies.
- **`packages/api-contracts`**: Contains versioned Zod schemas and TypeScript request/response contracts.
- **`packages/database`**: Contains Prisma schemas, migrations, repositories, and persistence logic.
- **`packages/contracts`**: Contains Solidity escrow smart contracts, Hardhat configuration, and test suites.

**Dependency Rules:**
- `apps/web` can depend on `@devforge/domain`, `@devforge/api-contracts`, `@devforge/database`, and `@devforge/observability`.
- `@devforge/domain` must NEVER depend on Next.js, Prisma, or HTTP libraries.
- Keep dependencies one-directional to avoid circular imports.

---

## 📝 Git Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```text
<type>(<scope>): <subject>
```

### Allowed Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes only
- `style`: Changes that do not affect the meaning of the code (formatting, linting)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to build process, tools, or dependencies

### Examples:
```bash
git commit -m "feat(escrow): add milestone refund timeout check"
git commit -m "fix(auth): handle wallet reconnection edge case"
git commit -m "docs(readme): add setup walkthrough and architecture diagram"
```

---

## 🔍 Pull Request Process

1. **Verify Quality Suite Locally**
   Before pushing, ensure all checks pass:
   ```bash
   pnpm check
   ```
   This command validates:
   - Code formatting (`pnpm format:check`)
   - ESLint rules (`pnpm lint`)
   - TypeScript types (`pnpm typecheck`)
   - Unit tests (`pnpm test`)

2. **Commit and Push**
   ```bash
   git push origin feat/your-feature-name
   ```

3. **Open a Pull Request**
   - Provide a clear summary of changes.
   - Reference related issues (e.g., `Closes #12`).
   - Include before/after screenshots for UI updates.
   - Ensure CI checks pass.

---

## 📐 Coding Standards

- **TypeScript**: Strict mode is enabled. Avoid `any`; use strongly typed generics or Zod-inferred types.
- **Components**: Use React 19 functional components with explicit props interfaces.
- **Styling**: Use utility classes with Tailwind CSS and Radix UI primitives.
- **Formatting**: Run `pnpm format` before committing.
- **Smart Contracts**: Follow Solidity style guides, ensure gas optimizations, and write unit tests for every public/external function in `DevForgeEscrow.sol`.

---

Thank you for contributing to DevForge! 🚀
