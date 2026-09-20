# Publisher Management System

A multi-tenant platform for managing publishers across organizations. This repository is the starting point for a technical interview assessment.


---

## Prerequisites

- Node.js 18 or later
- npm 9 or later

---

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The app will start but most functionality is stubbed out — that's intentional. See `TASKS.md`.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build for production |
| `npm run setup` | Copy `example.env` to `.env`, install, generate the Prisma client |
| `npm run db:push` | Create/sync tables from `prisma/schema.prisma` |
| `npm run db:seed` | Seed mock data (idempotent: clears and reloads) |
| `npm run db:reset` | Force-reset the DB and reseed |
| `npm run db:studio` | Browse the DB in Prisma Studio |

First run: `npm run setup && npm run db:push && npm run db:seed && npm run dev`.

---

## Project Structure

```
├── prisma/
│   ├── schema.prisma          # Schema
│   └── seed.ts                # Mock data
├── src/
│   ├── app/
│   │   ├── page.tsx                       # Dashboard: organization list
│   │   ├── organizations/[id]/page.tsx    # Organization detail + forms
│   │   └── api/organizations/...          # API routes
│   ├── components/            # Lists, forms, Loading, ErrorAlert, OrgSwitcher
│   └── lib/                   # db client, http helpers, constants, types, useApi
├── example.env
├── package.json
└── TASKS.md                   # Interview tasks
```
---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Prisma + SQLite (pre-wired — see `package.json` scripts and `example.env`)

---

## Schema

```
User ──< Membership >── Organization ──< Publisher
            │                               │
            └──── PublisherAccess ──────────┘   ──< PublisherPermission
```

- `Membership` (`orgId`, `userId`, `role`): user-to-organization, with an org role (`OWNER | ADMIN | MEMBER`). Primary key is the pair, so a user has at most one membership per org.
- `PublisherAccess` (`publisherId`, `userId`, `orgId`): a user's access to one publisher. `orgId` is denormalized on purpose so two **composite foreign keys** apply: `(orgId, userId)` must exist in `Membership` and `(orgId, publisherId)` must exist in `Publisher`. The database therefore rejects a grant to a non-member or across organizations.
- `PublisherPermission`: one row per permission (`VIEW | EDIT | PUBLISH | MANAGE_USERS`) on an access row. Removing access or membership cascades.
- `User.systemRole` is `USER | SYSTEM_ADMIN`, independent of any org role.
- Enum-like columns are strings (no SQLite enums in Prisma 5.14). Allowed values live in `src/lib/constants.ts` and are validated at the API boundary.

## API

All routes live under `src/app/api/organizations`. Errors are JSON: `{ "error": string, "fields"?: { [field]: string } }`.

| Route | Purpose |
|---|---|
| `GET /api/organizations` | List organizations with publisher and user counts |
| `GET /api/organizations/[orgId]` | Org metadata, publishers, and users with publisher access and permissions |
| `POST /api/organizations/[orgId]/publishers` | Create a publisher (`{ name }`); 409 if the name exists in this org |
| `POST /api/organizations/[orgId]/users` | Add a user to this org (see below) |

`POST .../users` body: `{ name, email, systemRole?, role?, publisherAccess?: [{ publisherId, permissions[] }] }`.
- New email: creates the user. Existing email: attaches that user and leaves their name and system role unchanged (200 instead of 201). Already a member: 409.
- Any publisher access implies `VIEW`: it is added automatically if omitted.
- Membership and publisher grants are written in one transaction. Publisher IDs must belong to this org, otherwise 400 and nothing is written.

**Tenant scoping:** every query starts from the `orgId` in the URL, and grants are checked against that org's publishers. The composite foreign keys are a second, database-level guard.

## Known gaps

- **No authentication or authorization.** Any caller can read or modify any organization. With auth, each route would resolve the caller's identity and require membership of `[orgId]` (plus owner/admin, or `MANAGE_USERS`, for writes), returning 404 for orgs the caller cannot see.
- **`SYSTEM_ADMIN` escalation.** The task requires setting a system role when adding a user, and `POST .../users` honors it. Unauthenticated, that lets anyone create a system admin. With auth, only an existing system admin could set `systemRole`.
- **Attaching an existing user** by email lets a caller add any known user to an org. Acceptable for this scope; with auth it would be restricted to org admins.
- **No update or delete endpoints**, and no pagination.
- **No automated tests and no ESLint config** (`next lint` prompts interactively).
- **Scaffold issue fixed:** `db:reset` used `prisma migrate reset`, which cannot work without migrations. It now uses `db push --force-reset`.
