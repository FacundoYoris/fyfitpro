# AGENTS.md - FY FitPro

Guidance for agentic coding tools operating in this repository.
Prioritize existing code conventions over generic best practices.

## Stack and Layout
- `backend/`: Express + TypeScript + Prisma + Jest/Supertest.
- `frontend/`: React 18 + Vite + TypeScript + Playwright.
- Active DB in code: SQLite (`backend/prisma/schema.prisma`).
- API prefix: `/api`; backend dev port `3001`, frontend dev port `3000`.

Key folders:
- `backend/src/controllers`, `backend/src/routes`, `backend/src/middleware`, `backend/src/config`, `backend/src/__tests__`
- `frontend/src/pages`, `frontend/src/components`, `frontend/src/services`, `frontend/src/context`, `frontend/tests`

## Install
```bash
npm install --prefix backend
npm install --prefix frontend
```

## Build / Lint / Test Commands

Note: no lint scripts are currently configured in `backend/package.json` or `frontend/package.json`.

### Backend commands
```bash
npm --prefix backend run dev
npm --prefix backend run build
npm --prefix backend run start
npm --prefix backend run db:seed
npm --prefix backend run test
npm --prefix backend run test:watch
npm --prefix backend run test:coverage
```

Run a single backend test file:
```bash
npm --prefix backend run test -- src/__tests__/userController.test.ts
```

Run a single backend test case by title:
```bash
npm --prefix backend run test -- -t "deberia obtener usuario por ID"
```

### Frontend commands
```bash
npm --prefix frontend run dev
npm --prefix frontend run build
npm --prefix frontend run preview
npm --prefix frontend run test
npm --prefix frontend run test:ui
npm --prefix frontend run test:headed
```

Run a single frontend Playwright spec file:
```bash
npm --prefix frontend run test -- tests/auth.spec.ts
```

Run a single frontend Playwright test by title:
```bash
npm --prefix frontend run test -- -g "deberia iniciar sesion exitosamente"
```

### Prisma / DB commands
```bash
npx --prefix backend prisma generate
npx --prefix backend prisma migrate dev
npx --prefix backend prisma studio
```

## Code Style Rules

## TypeScript and types
- `strict` mode is enabled in both apps; frontend also enforces unused checks.
- Prefer explicit types on exported functions and public service methods.
- Avoid `any`; use `unknown`, discriminated unions, or explicit interfaces.
- For authenticated requests, prefer typed request extensions (`AuthRequest`) over repetitive `(req as any)`.

## Formatting
- 2-space indentation, semicolons, single quotes.
- Keep object literals and JSX props multiline when they become long.
- Keep functions focused and avoid deeply nested logic.
- Do not introduce a formatter config unless requested; preserve local style.

## Imports
Use this order when editing files:
1. External packages (`react`, `express`, `axios`, etc.)
2. Internal/aliased modules (if present)
3. Relative imports (`../`, `./`)
4. Style imports (`.css`) last

Prefer stable ordering within groups when practical.

## Naming
- Components/types/interfaces: PascalCase.
- Variables/functions: camelCase.
- Constants: UPPER_SNAKE_CASE only for true constants.
- Route segments: kebab-case for multi-word paths.
- Keep naming in Spanish or English consistent with surrounding file.

## Backend conventions
- Controllers are async and wrapped in `try/catch`.
- Use early returns for validation/auth/not-found branches.
- Return consistent JSON envelopes:
  - success -> `{ success: true, data: ... }`
  - error -> `{ success: false, message: '...' }`
- Use proper status codes (`400`, `401`, `403`, `404`, `500`).
- Never expose secrets or password hashes in responses.
- Prefer Prisma `select`/`include` intentionally; fetch only needed fields.
- Hash passwords with `bcryptjs` before writing user credentials.

## Frontend conventions
- Functional components and hooks only.
- Keep API calls in `src/services/*`, not directly in page JSX.
- Reuse `src/services/api.ts` Axios instance and auth interceptors.
- Service functions should return `response.data` payloads.
- Handle loading, empty, and error states explicitly in pages.
- Keep page-local styles colocated with the page/component.

## Error handling
- Backend: log with context and return safe, user-readable messages.
- Frontend: show visible feedback (toast/alert/message) on failures.
- Do not silently swallow errors.

## Testing guidelines
- Backend tests: Jest + Supertest in `backend/src/__tests__`.
- Frontend tests: Playwright specs in `frontend/tests`.
- Assert both status code and response body shape for API tests.
- Prefer user-observable assertions in Playwright tests.
- Keep tests deterministic and isolated from external dependencies.

## Cursor/Copilot Rules Check

Searched and found no files at:
- `.cursorrules`
- `.cursor/rules/`
- `.github/copilot-instructions.md`

If these files are added later, treat them as higher-priority local instructions.

## Agent Workflow Expectations
- Make minimal, targeted edits.
- Avoid broad refactors unless explicitly requested.
- If docs conflict with code behavior, trust code and update docs in same change.
- Run relevant build/tests for touched areas when feasible.
