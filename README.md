# API Response Validator & Mock Generator

[![Live Demo](https://img.shields.io/badge/Live-Demo-1e3a8a?style=for-the-badge&logo=terminal)](https://portfolio-code-workspace.vercel.app/)
[![behance](https://img.shields.io/badge/behance-1769FF?style=for-the-badge&logo=behance&logoColor=white)](https://www.behance.net/ingfranciscastillo)
[![github_stars](https://img.shields.io/github/stars/ingfranciscastillo/api-response-validator-mock-generator?style=for-the-badge)](https://github.com/ingfranciscastillo/api-response-validator-mock-generator/stargazers)
[![license](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](LICENSE)
[![linkedin](https://img.shields.io/badge/linkedin-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/ingfranciscastillo)
[![last_commit](https://img.shields.io/github/last-commit/ingfranciscastillo/api-response-validator-mock-generator?style=for-the-badge)](https://github.com/ingfranciscastillo/api-response-validator-mock-generator/commits/main)

<!-- README-I18N:START -->

**English** | [Español](./README.es.md)

<!-- README-I18N:END -->

Full-stack SaaS platform for API teams to validate responses against OpenAPI specs, generate realistic mock data, and detect contract drift.

## Features

- **Response Validation** — Send requests to your API and validate responses against OpenAPI/Swagger specs (2.0, 3.0, 3.1) with structured violation reports.
- **Mock Generation** — Generate realistic payloads from schema definitions using faker-driven templates, including edge-case and error variants.
- **Contract Drift Detection** — Scheduled background jobs poll your endpoints and compare live responses against your specs, surfacing breaking changes and diffs.
- **Spec Management** — Import specs via file upload, text paste, or URL fetch. Browse endpoints with an interactive schema tree viewer. Compare versions side-by-side.
- **Export Reports** — Export validation results as HTML, PDF, or JSON.
- **Workspace Multitenancy** — Organization-scoped teams with role-based access control (owner, admin, member).
- **Dark Mode** — Built-in dark mode support with system-aware toggling.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [TanStack Start](https://tanstack.com/start) (SSR, server functions, file-based routing) |
| **Routing** | [TanStack Router](https://tanstack.com/router) (type-safe) |
| **State** | [TanStack Query](https://tanstack.com/query), [TanStack Form](https://tanstack.com/form), [TanStack Table](https://tanstack.com/table) |
| **UI** | React 19, Tailwind CSS v4, [shadcn/ui](https://ui.shadcn.com/), Radix UI, Lucide icons |
| **Charts** | Recharts |
| **Database** | Neon (serverless Postgres) + [Drizzle ORM](https://orm.drizzle.team) |
| **Auth** | [Better Auth](https://www.better-auth.com) (email/password, GitHub/Google OAuth, organizations) |
| **Validation** | AJV, ajv-formats, @apidevtools/swagger-parser |
| **Mock Data** | json-schema-faker + @faker-js/faker |
| **Background Jobs** | Inngest (drift detection cron, alerts) |
| **Storage** | Cloudflare R2 (S3-compatible for large specs, exports) |
| **Linting** | Biome |
| **Testing** | Vitest |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- [pnpm](https://pnpm.io/) >= 9
- A [Neon](https://neon.tech) Postgres database (or any Postgres-compatible)

### Installation

```bash
pnpm install
```

### Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon Postgres connection string (pooled) |
| `DATABASE_URL_UNPOOLED` | Neon Postgres direct connection (for migrations) |
| `BETTER_AUTH_SECRET` | Auth secret (generate with `pnpm dlx @better-auth/cli secret`) |
| `BETTER_AUTH_URL` | App URL for auth callbacks |
| `APP_URL` | Application base URL |
| `R2_*` | Cloudflare R2 credentials (optional, for large-file storage) |
| `INNGEST_*` | Inngest event key and signing key (optional, for drift detection) |

### Database

```bash
pnpm db:generate    # Generate SQL migrations
pnpm db:migrate     # Apply migrations to your database
pnpm db:push        # Push schema changes directly (dev only)
```

### Development

```bash
pnpm dev
```

Opens at [http://localhost:3000](http://localhost:3000).

### Inngest (Drift Detection)

```bash
npx inngest-cli dev
```

Starts the Inngest dev server at [http://localhost:8288](http://localhost:8288) and registers local drift-detection functions. No Inngest account required for development.

### Production Build

```bash
pnpm build
pnpm preview
```

### Testing

```bash
pnpm test
```

## Usage

### 1. Import an OpenAPI Spec

Navigate to **Specs** → **New Spec**. Upload a JSON/YAML file, paste raw content, or fetch from a URL. The parser supports OpenAPI 2.0, 3.0, and 3.1.

### 2. Validate Responses

Go to the **Validation Workspace**, select a spec and endpoint, then configure your request:

- Set the HTTP method and base URL
- Fill path/query parameters and headers
- Provide a request body (for POST/PUT/PATCH)
- Click **Send Request**

The engine runs the response through AJV against your spec's schema and returns a structured result with violations grouped by severity.

### 3. Generate Mocks

From the **Mocks** page, select a spec version and target response status code. The generator builds payloads from the schema properties — required fields first, then optional, plus error and edge-case variants.

### 4. Monitor Drift

Set up **Monitored Specs** to have Inngest poll your endpoints on a schedule. When a live response differs from the spec, you'll get a drift alert with a detailed diff.

## Project Structure

```
src/
├── routes/              # File-based routing
│   ├── dashboard/       # Protected dashboard (specs, validation, mocks, drift, reports, team, settings)
│   ├── login.tsx        # Auth pages
│   └── ...
├── components/          # UI components
│   ├── ui/              # shadcn/ui primitives
│   ├── validation/      # ValidationRequestBuilder, ValidationResultCard, DiffViewer
│   ├── specs/           # EndpointExplorer, SchemaTreeViewer
│   ├── mocks/           # Mock payload viewer, generation rules
│   ├── dashboard/       # Stat cards, charts, tables
│   └── landing/         # Marketing pages
├── db/
│   ├── schema/          # Drizzle schema per domain (auth, spec, validation, mocks, drift, report, audit)
│   └── index.ts         # DB client
├── lib/
│   ├── specs/           # Spec import, parsing, CRUD (server functions)
│   ├── validation/      # Validation engine, diff logic (server functions)
│   ├── mocks/           # Mock generation (server functions)
│   └── auth/            # Server-side auth helpers
└── integrations/        # Auth client, TanStack Query provider
```

## Documentation

Comprehensive design and architecture docs are available in the [`docs/`](./docs/) directory:

- [Architecture](./docs/architecture.md)
- [Database Schema](./docs/database.md)
- [Auth & Permissions](./docs/auth_and_permissions.md)
- [API Reference](./docs/api_spec.md)
- [Component Library](./docs/components.md)
- [Design System](./docs/design_system.md)
- [Roadmap](./docs/roadmap.md)

## Contributing

Contributions are welcome! Please open an issue or pull request.

### Development Setup

```bash
git clone https://github.com/ingfranciscastillo/api-response-validator-mock-generator.git
cd api-response-validator-mock-generator
pnpm install
cp .env.local.example .env.local
# Fill in your DATABASE_URL and auth secret
pnpm db:push
pnpm dev
```

### Lint & Format

```bash
pnpm lint
pnpm format
pnpm check
```

## License

[MIT](./LICENSE) © Francis Castillo.
