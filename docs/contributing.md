# Contributing to C(AI)DENCE

Thank you for contributing to C(AI)DENCE. This document covers branch conventions, coding standards, testing requirements, and the pull request process.

---

## 1. Getting Started

1. Fork the repository on GitHub.
2. Clone your fork locally.
3. Follow the [Local Development Setup](./setup-guide.md) guide to install backend and frontend dependencies, start the database, and run the development servers.
4. Confirm that the backend is accessible at `http://localhost:8080` and the frontend at `http://localhost:3000` before writing any code.

---

## 2. Branch Naming

Use the following conventions when creating branches:

| Type | Pattern | Example |
|---|---|---|
| Feature | `feature/P<phase>-<id>-<short-description>` | `feature/P18-001-abc-profiles-ui` |
| Bug fix | `fix/issue-<id>` | `fix/issue-123` |
| Documentation | `docs/<topic>` | `docs/admin-guide` |
| Chore / refactor | `chore/<description>` | `chore/cleanup-tenant-filters` |

Reference the TRACKER.md phase and task ID in feature branch names so that work can be traced back to the project plan.

---

## 3. Coding Standards — Backend

The backend is a FastAPI application using SQLAlchemy 2.0 async and Pydantic v2. Follow these conventions in all backend code:

**Async/Await**
All database operations must use `async/await` with `AsyncSession`. Never use synchronous SQLAlchemy sessions in endpoint handlers or service functions.

**Relationship Loading**
Use `selectinload` (from `sqlalchemy.orm`) for eager-loading relationships in queries. Avoid implicit lazy loading, which will raise `MissingGreenlet` errors in an async context.

```python
result = await db.execute(
    select(User)
    .options(selectinload(User.custom_permissions), selectinload(User.role_model))
    .where(User.id == user_id)
)
```

**Tenant Isolation**
Apply tenant filters using the helpers in `backend/app/core/tenant_filter.py`. Do not write manual `WHERE organization_id = ?` clauses in endpoint code — use `apply_org_filter` so that super admin bypass logic is applied consistently.

```python
from app.core.tenant_filter import apply_org_filter

query = select(Campaign)
query = apply_org_filter(query, Campaign, current_user)
result = await db.execute(query)
```

**Permission Enforcement**
Use the `require_permission()` decorator (or the `PermissionGate` pattern via `PermissionEngine`) on endpoints that require resource-level access checks. The `_require_admin` helper in the RBAC router raises a `403` if the caller is not at least `super_admin`.

**Schemas**
Use Pydantic v2 schema patterns: `model_dump()` instead of `.dict()`, `model_validate()` instead of `from_orm()`, and `model_dump(exclude_unset=True)` for partial updates.

---

## 4. Coding Standards — Frontend

The frontend is a Next.js 14 application using the App Router with TypeScript strict mode.

**Server vs. Client Components**
Only add `"use client"` at the top of a file when the component genuinely requires browser APIs, React hooks, or event handlers. Prefer server components for data-fetching and layout work.

**Permission-Gated UI**
Wrap any UI element that requires a permission check in the `PermissionGate` component:

```tsx
import { PermissionGate } from "@/components/rbac/PermissionGate";

<PermissionGate require="creators:write">
  <CreateCreatorButton />
</PermissionGate>
```

Never hide UI by checking roles directly in component code — always go through `PermissionGate` or the permission utilities in `frontend/src/lib/permissions.ts`.

**API Calls**
Use `authenticatedFetch` from the API layer (`frontend/src/lib/api/`) for all requests to the backend. This utility attaches the JWT token from local storage and handles 401 responses. Do not use `fetch` directly in component code.

**TypeScript**
The project uses TypeScript strict mode. Do not use `any` types. Import shared types from `frontend/src/lib/permissions.ts` (e.g., `UserRole`, `Permission`) rather than redefining them locally.

---

## 5. Testing

### Backend Tests

- **Framework:** pytest + pytest-asyncio + httpx
- **Location:** `backend/tests/`
- **Run:** `python -m pytest tests/ -v --tb=short` from the `backend/` directory

The CI pipeline runs most unit tests together but isolates RBAC integration tests (`test_rbac_enforcement_v2.py` and `test_rbac_simple.py`) in a separate step because they have ordering dependencies when run as a suite.

**Critical — SQLAlchemy 2.0 Async Mock Pattern**

When mocking SQLAlchemy 2.0 async sessions in unit tests, use the correct mock types for each call:

```python
from unittest.mock import MagicMock, AsyncMock

mock_session = MagicMock()

# session.execute() is async — must be AsyncMock
mock_session.execute = AsyncMock(return_value=mock_result)

# result.scalar_one_or_none() is sync — must be MagicMock, NOT AsyncMock
mock_result = MagicMock()
mock_result.scalar_one_or_none.return_value = some_object

# result.scalars().all() — both are sync
mock_result.scalars.return_value.all.return_value = [item1, item2]
```

Using `AsyncMock` for result objects will cause `'coroutine' object has no attribute 'scalar_one_or_none'` errors at runtime.

### Frontend Unit Tests

- **Framework:** Vitest + React Testing Library + jsdom
- **Location:** `frontend/src/**/__tests__/`
- **Run:** `npx vitest run` from the `frontend/` directory

### Frontend E2E Tests

- **Framework:** Playwright v1.58.0
- **Location:** `frontend/tests/e2e/`
- **Run:** `npx playwright test --reporter=list` from the `frontend/` directory
- The E2E suite requires the frontend to be built first (`npm run build`) and continues even on failure (`continue-on-error: true` in CI) to allow artifact collection.

---

## 6. CI Pipeline

The CI pipeline is defined in `.github/workflows/ci.yml` and runs on every push to `main` or `develop` and on all pull requests targeting `main`. It consists of four jobs:

| Job | Name | Description |
|---|---|---|
| `backend-tests` | Backend Tests | Spins up a PostgreSQL 15 service, installs Python 3.11 dependencies, runs unit tests, then runs RBAC integration tests separately. |
| `frontend-unit-tests` | Frontend Unit Tests | Installs Node.js 18 dependencies with `npm ci --legacy-peer-deps` and runs `npx vitest run`. |
| `frontend-e2e-tests` | Frontend E2E Tests | Depends on both prior jobs passing. Installs Playwright with Chromium, builds the frontend, and runs `npx playwright test`. Uploads a `playwright-report` artifact on completion. |
| `lint` | Lint | Runs `npm run lint` on the frontend (non-blocking via `|| true`). |

The `frontend-e2e-tests` job has `needs: [backend-tests, frontend-unit-tests]`, meaning it only starts after both earlier jobs succeed.

---

## 7. PR Process

1. Create a branch following the naming convention above.
2. Make your changes, following the coding standards in sections 3 and 4.
3. Run the relevant test suites locally and confirm they pass:
   - Backend: `python -m pytest tests/ -v --tb=short`
   - Frontend unit: `npx vitest run`
   - Frontend E2E (optional locally): `npx playwright test`
4. Push your branch and open a pull request against `main`.
5. Write a PR description that includes:
   - **Summary** — what changed and why (2–5 bullet points)
   - **Test plan** — a checklist of how the change was verified
6. Reference the TRACKER.md task ID in the PR title or description (e.g., `P18-001`).
7. Ensure all CI jobs pass before requesting review.

---

## 8. Issue Tracking

All tasks, bugs, and features are tracked in [TRACKER.md](../TRACKER.md) at the root of the repository. When committing work related to a tracked item:

- Include the TRACKER.md phase and task ID in the branch name: `feature/P18-001-description`
- Reference the ID in the commit message body or PR description so the change can be traced back to the original requirement
- Mark items as complete in TRACKER.md as part of the same PR that delivers the work, not as a separate commit
