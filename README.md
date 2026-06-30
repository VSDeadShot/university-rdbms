# 🎓 University RDBMS

A modern, full-stack Relational Database Management System for Universities. Built with a sleek glassmorphic UI, robust business logic, and comprehensive analytics.

## ✨ Features

- **🔐 Role-Based Access Control (RBAC):** Distinct dashboards for Students, Instructors, and Admins. Ensure users only see and interact with data relevant to their role.
- **📄 PDF Transcripts:** Instantly generate and download beautifully formatted official PDF report cards/transcripts.
- **📧 Automated Email Notifications:** NodeMailer integration with Ethereal Email to send Welcome emails and instant Grade Update alerts.
- **🔒 Secure Authentication:** JWT-based login and registration system with session persistence.
- **📚 Course Management:** Enforces business rules like maximum capacities and course prerequisites dynamically.
- **📊 Advanced Analytics:** Beautiful, interactive charts (Pie, Bar, Area) visualizing student distributions, GPA curves, and popular courses.
- **📥 One-Click Exports:** Export any data grid (Students, Courses, Departments, Enrollments) directly to formatted CSV files.
- **🛡️ Fully Tested:** Comprehensive automated testing suite (Vitest + Supertest) ensuring maximum reliability.

## 🛠️ Technology Stack

- **Frontend:** React, Vite, Lucide Icons, Recharts
- **Backend:** Node.js, Express.js, TypeScript
- **Database:** SQLite, Prisma ORM
- **Testing:** Vitest, Supertest, React Testing Library

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js (v18+) installed on your machine.

### 1. Installation

Clone the repository and install dependencies for both the frontend and backend:

```bash
# Clone the repository
git clone https://github.com/VSDeadShot/university-rdbms.git
cd university-rdbms

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Database Setup

Navigate to the `backend` folder and initialize the SQLite database using Prisma:

```bash
cd backend
npx prisma db push
npx prisma generate
```

### 3. Running the Application

You will need two terminal windows to run the frontend and backend simultaneously.

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

Open your browser and navigate to `http://localhost:5173` (or the port provided by Vite) to explore the system!

## 🧪 Running Tests

The application includes a comprehensive test suite covering both the frontend UI and backend API routes.

```bash
# Run backend API integration tests
cd backend
npm run test

# Run frontend component tests
cd frontend
npm run test
```

---
*Developed by VSDeadShot*
