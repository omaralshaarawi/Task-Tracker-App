# Daymark Task Tracker

Daymark is a database-backed task tracker for turning a scattered workload into a clear daily plan.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/task-tracker/` — React + Vite dashboard, task list, and preferences screens
- `artifacts/api-server/src/routes/tasks.ts` — task CRUD and dashboard summary endpoints
- `lib/db/src/schema/tasks.ts` — PostgreSQL task schema and Drizzle model
- `lib/api-spec/openapi.yaml` — source of truth for the generated API client and validation schemas
- `artifacts/task-tracker/src/index.css` — Daymark visual theme and shared Tailwind tokens

## Architecture decisions

- The API contract is defined in OpenAPI first and generated into the shared React Query client and Zod validators.
- Tasks use PostgreSQL with serial IDs, enum-backed status and priority values, calendar-only due dates, and timestamped activity fields.
- Dashboard totals and recent activity are derived from the same live task records as the task list, so mutations stay consistent after cache invalidation.
- The app is intentionally single-workspace for the first version; user accounts and multi-workspace ownership can be layered on later.

## Product

- See total, in-progress, due-today, completion, and overdue signals at a glance
- Create, edit, complete, reprioritize, filter, search, and delete tasks
- Store optional descriptions and due dates in the live PostgreSQL database
- Configure lightweight planning preferences locally

## User preferences

No explicit user preferences have been provided.

## Gotchas

- After changing `lib/api-spec/openapi.yaml`, run `pnpm --filter @workspace/api-spec run codegen`.
- After changing a `lib/*` package, run `pnpm run typecheck:libs` before checking leaf packages.
- The shared proxy routes API requests through `/api`; frontend calls should remain relative and use the generated client.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
