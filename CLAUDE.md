# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

University RDBMS: a full-stack course/enrollment management system with RBAC dashboards (Student/Instructor/Admin), PDF transcripts, email notifications, and analytics.

## Commands

Backend (`backend/`):
```bash
npm install
npx prisma db push        # sync SQLite schema (backend/prisma/dev.db)
npx prisma generate       # regenerate Prisma client after schema.prisma changes
npm run dev                # nodemon + ts-node, http://localhost:5000
npm run test                # vitest run (backend/tests/api.test.ts, Supertest against the Express app)
npx vitest run tests/api.test.ts -t "should login"   # single test
```

Frontend (`frontend/`):
```bash
npm install
npm run dev       # Vite dev server, http://localhost:5173
npm run build      # tsc -b && vite build
npm run lint        # eslint .
npm run test          # vitest run (jsdom + React Testing Library)
npx vitest run src/App.test.tsx   # single test file
```

Docker (from repo root): `docker-compose up -d --build` runs backend on :5000 and frontend (nginx) on :5173.

There is no root-level package.json — backend and frontend are independent npm projects run from their own directories.

## Architecture

**Backend is a single-file Express app** (`backend/server.ts`, ~420 lines): all routes (auth, students, departments, courses, enrollments, statistics) live in one file, grouped by `// ==== SECTION ====` comment banners, using Prisma Client directly inline (no separate controller/service/repository layers, no router files). Follow this flat-file convention when adding routes rather than introducing new structure.

- **Auth is JWT-based but only enforced client-side.** `/api/auth/login` and `/api/auth/register` issue a JWT and the frontend attaches it as `Authorization: Bearer` (`frontend/src/api/index.ts`), but `server.ts` has no middleware that verifies the token or checks role on any route — every endpoint is effectively open. RBAC (`ADMIN`/`INSTRUCTOR`/`STUDENT`) is enforced only by which tabs `App.tsx` renders (`allTabs[].roles` filter). Do not assume the backend rejects unauthorized requests.
- **Prisma schema** (`backend/prisma/schema.prisma`): `Department` → `Student`/`Course` (1:many), `Enrollment` is the Student↔Course join table (unique on `[student_id, course_id]`), `Course` has a self-relation `prerequisite_id` for prerequisite chains, and `User` holds login credentials with an optional 1:1 link to `Student` plus a `role` string.
- Business rules (course capacity, prerequisite completion check) are enforced inline in the `POST /api/enrollments` handler, not in the Prisma layer or a separate validator.
- **Email is fake/dev-only**: `backend/emailService.ts` uses Nodemailer's Ethereal test SMTP account (generated fresh on server start) — emails never reach real inboxes; the preview URL is logged to the console. Don't expect production email delivery without swapping this out.

**Frontend** is a single-page app with no router: `App.tsx` holds `activeTab` state and conditionally renders one of `StudentsTab`/`DepartmentsTab`/`CoursesTab`/`EnrollmentsTab`/`AnalyticsTab` (all in `frontend/src/components/`, flat, no nested folders). `AuthContext` (`frontend/src/context/AuthContext.tsx`) persists `user`/`token` to `localStorage` and gates the whole app (`AuthPage` renders if no user). All API calls go through the single `apiRequest()` helper in `frontend/src/api/index.ts`, which hardcodes `http://localhost:5000/api` as the base URL (no env var) and auto-attaches the stored bearer token. PDF transcripts are generated client-side with `jspdf`/`jspdf-autotable` (`frontend/src/utils/pdfGenerator.ts`). Styling is Tailwind; dark/light mode toggles a `light-mode` class on `document.body`, persisted to `localStorage('theme')`.

## Workflow rules

- Propose one change at a time and wait for local review before moving to the next; only commit/push after I explicitly approve.
- Never commit or push notes/handoff/scratch files to the repo.
