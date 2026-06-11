# Project Handover: University Database Management System (RDBMS)

## Goal
The primary goal of this project is to build a modern, full-stack **University Database Management System (RDBMS)**. The application is designed to manage Students, Courses, Departments, and Enrollments, alongside providing a dashboard with analytics and a global search functionality.

## Current Architecture & State
The project is currently in a transitional state with a split architecture.

### Frontend
- **Stack:** React, TypeScript, Vite, TailwindCSS.
- **Location:** `frontend/` directory.
- **State:** Functional and well-structured. Includes a `Dashboard` with multiple tabs (`StudentsTab`, `CoursesTab`, `DepartmentsTab`, `EnrollmentsTab`, `AnalyticsTab`) and a `GlobalSearch` component.
- **API Connection:** Configured in `frontend/src/api/index.ts` pointing to `http://localhost:5000/api`.

### Backend (The Anomaly)
We currently have **two competing backend implementations** sharing the same target port (`5000`).
1.  **Modern Backend (Node.js/Prisma) - *Presumed Target State***
    - **Stack:** Node.js, Express, TypeScript, Prisma ORM, SQLite.
    - **Location:** `backend/` directory (`server.ts`, `prisma/schema.prisma`).
    - **State:** Mostly complete CRUD endpoints for students, departments, courses, enrollments, and statistics. Includes a database seeding script (`backend/prisma/seed.ts`).
2.  **Legacy Backend (Python/Flask)**
    - **Stack:** Python, Flask, MySQL.
    - **Location:** Root directory (`app.py`, `templates/index.html`).
    - **State:** Contains full endpoint logic mapping to a MySQL database (`university_db`). Includes explicit fixes for decimal serialization and native password authentication.

## What Has Been Done
1.  **Frontend Foundation:** The React interface is built with distinct tabs for managing university entities and visualizing data.
2.  **Database Schemas:** Both Prisma schema (SQLite) and presumed MySQL schemas are structured around Students, Departments, Courses, and Enrollments.
3.  **API Layer:** The frontend is hooked up to make REST calls.
4.  **Backend Logic:** Full CRUD operations and complex statistical queries (e.g., GPA averages, top students, department distributions) have been implemented in *both* backend languages.

## What We Were Working On / Immediate Next Steps
The immediate priority upon resuming this project is to resolve the backend duality.

1.  **Consolidate the Backend:**
    - Decide definitively between the Node.js/Prisma/SQLite stack or the Python/Flask/MySQL stack.
    - If migrating to Node.js, we need to ensure all features present in `app.py` are fully replicated and tested in `backend/server.ts`, and then deprecate the Python files.
    - If sticking with Python, we should clean up the `backend/` folder to reduce confusion.
2.  **Environment Setup & Verification:**
    - The new agent should start by launching both the chosen backend and the frontend to verify the current integration state.
    - Run the seeders (if using Node.js) or verify the MySQL database connection (if using Python).
3.  **Testing & Refinement:**
    - We currently lack an automated test suite (no test files detected). Setting up basic integration tests for the API and unit tests for the frontend components should be a priority once the stack is finalized.
4.  **Address Open Fixes:**
    - Review `app.py` (if keeping Python) or `server.ts` for any hardcoded values or minor structural mismatches noted during the migration phase.

## Notes for Antigravity CLI
- Treat `frontend/` as the single source of truth for the UI.
- Begin your first session by asking the user which backend path (Node/Prisma vs. Python/Flask) they intend to proceed with.
- The `npm` and `npx` commands currently require execution policy bypasses or configuration on the local Windows machine if scripts are restricted.
