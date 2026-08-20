# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Source of truth
Read `docs/MASTER_TZ.md` first. Architectural decisions live in `docs/DECISIONS.md` — do not contradict them without adding a new decision entry explaining why.

## Architecture rules (backend)
- Clean Architecture: `Domain` has zero dependencies; `Application` depends only on `Domain`; `Infrastructure` implements `Application` interfaces; `Api` wires everything via DI. Never reference EF Core from `Domain` or `Application`.
- CQRS via MediatR; handlers return `Result`/`Result<T>`, not exceptions, for expected failures.
- No business logic in controllers. No generic repository-for-everything — repositories exist per aggregate root where persistence behavior is non-trivial; simple reads go through `IReadDbContext` queries in query handlers.

## Architecture rules (frontend)
- All HTTP calls go through the typed API layer in `src/api/` — never call axios directly from a component.
- Strict TypeScript; no `any` without a comment justifying it.
- Every data-driven view handles loading/error/empty/success states.

## Conventions
- Locales: `ru` (default, unprefixed routes), `tg`, `en`.
- Translatable entities use child `*Translation` tables, not JSON columns (DEC-001).
- No mock/demo business data in production code paths — seed data is dev-only (see `Infrastructure/Persistence/Seed`).

## Commands
- Backend build: `cd backend && dotnet build`
- Backend tests: `cd backend && dotnet test`
- Frontend build: `cd frontend && npm run build`
- Frontend lint: `cd frontend && npm run lint`
