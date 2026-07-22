import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ts = Date.now();

async function registerAndLogin(role: 'INSTRUCTOR' | 'STUDENT', extra: Record<string, string> = {}) {
  const email = `${role.toLowerCase()}_${ts}_${Math.random().toString(36).slice(2)}@university.edu`;
  const password = 'password123';
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password, role, ...extra });
  return { email, password, token: res.body.token as string, status: res.status };
}

// Public registration deliberately cannot create ADMIN accounts (see the
// "should reject public self-registration as ADMIN" test), so an Admin test
// user is provisioned directly via Prisma instead, the same way the real
// seeded admin account (backend/prisma/seed.ts) is provisioned. The token
// itself still comes from the real POST /api/auth/login endpoint.
async function createAdminAndLogin() {
  const email = `admin_${ts}_${Math.random().toString(36).slice(2)}@university.edu`;
  const password = 'password123';
  await prisma.user.create({
    data: { email, password: await bcrypt.hash(password, 10), role: 'ADMIN' },
  });
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return { email, password, token: res.body.token as string };
}

describe('University API Integration Tests', () => {
  it('GET / should return running message', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('University Management API is running');
  });

  describe('Authentication Endpoints', () => {
    const testUser = {
      email: `test${Date.now()}@university.edu`,
      password: 'password123',
      name: 'Test User'
    };

    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe(testUser.email);
    });

    it('should login an existing user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid credentials');
    });

    it('should reject public self-registration as ADMIN', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: `wannabe_admin_${ts}@university.edu`, password: 'password123', role: 'ADMIN' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('STUDENT or INSTRUCTOR');
    });
  });

  describe('Authorization: JWT verification and role enforcement', () => {
    let adminToken: string;
    let instructorToken: string;
    let studentToken: string;
    let studentId: string;
    let otherStudentId: string;

    beforeAll(async () => {
      const deptId = `AUTHDEPT_${ts}`;
      studentId = `AUTHSTU_${ts}`;
      otherStudentId = `AUTHSTU2_${ts}`;

      await prisma.department.create({ data: { dept_id: deptId, dept_name: `Auth Test Dept ${ts}` } });
      await prisma.student.create({ data: { student_id: studentId, name: 'Auth Student', email: `${studentId}@test.com`, status: 'Active', year: 1, dept_id: deptId } });
      await prisma.student.create({ data: { student_id: otherStudentId, name: 'Other Student', email: `${otherStudentId}@test.com`, status: 'Active', year: 1, dept_id: deptId } });

      adminToken = (await createAdminAndLogin()).token;

      const instructor = await registerAndLogin('INSTRUCTOR', { instructor_name: `Prof Auth ${ts}` });
      instructorToken = instructor.token;

      const student = await registerAndLogin('STUDENT', { student_id: studentId });
      studentToken = student.token;
    });

    it('rejects requests to a protected route with no token', async () => {
      const res = await request(app).get('/api/students');
      expect(res.status).toBe(401);
    });

    it('rejects requests with a malformed/invalid token', async () => {
      const res = await request(app).get('/api/students').set('Authorization', 'Bearer not-a-real-token');
      expect(res.status).toBe(401);
    });

    it('allows Admin to list students', async () => {
      const res = await request(app).get('/api/students').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('allows Instructor to list students', async () => {
      const res = await request(app).get('/api/students').set('Authorization', `Bearer ${instructorToken}`);
      expect(res.status).toBe(200);
    });

    it('rejects a Student token on the Admin/Instructor-only student list', async () => {
      const res = await request(app).get('/api/students').set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    it('rejects a Student token on POST /api/students (Admin only)', async () => {
      const res = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ student_id: `SHOULDFAIL_${ts}`, name: 'X', email: `x${ts}@test.com`, dept_id: 'AUTHDEPT', year: 1 });
      expect(res.status).toBe(403);
    });

    it('rejects an Instructor token on DELETE /api/students/:id (Admin only)', async () => {
      const res = await request(app)
        .delete(`/api/students/${studentId}`)
        .set('Authorization', `Bearer ${instructorToken}`);
      expect(res.status).toBe(403);
    });

    it('allows a Student to view their own profile', async () => {
      const res = await request(app)
        .get(`/api/students/${studentId}`)
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
      expect(res.body.student_id).toBe(studentId);
    });

    it("rejects a Student viewing another student's profile", async () => {
      const res = await request(app)
        .get(`/api/students/${otherStudentId}`)
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    it('rejects a Student token on POST /api/enrollments (Admin/Instructor only)', async () => {
      const res = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ student_id: studentId, course_id: 'SOME101' });
      expect(res.status).toBe(403);
    });

    it('rejects a Student token on PUT /api/enrollments/:id (Admin/Instructor only)', async () => {
      const res = await request(app)
        .put('/api/enrollments/1')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ grade: 'A' });
      expect(res.status).toBe(403);
    });

    it('rejects an Instructor token on POST /api/courses (Admin only)', async () => {
      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ course_id: `SHOULDFAIL_${ts}`, course_name: 'X', dept_id: 'AUTHDEPT', credits: 3, instructor: 'X', semester: 'Fall' });
      expect(res.status).toBe(403);
    });

    it('allows any authenticated role to read shared reference data (departments/courses/statistics)', async () => {
      for (const token of [adminToken, instructorToken, studentToken]) {
        const [deptRes, courseRes, statsRes] = await Promise.all([
          request(app).get('/api/departments').set('Authorization', `Bearer ${token}`),
          request(app).get('/api/courses').set('Authorization', `Bearer ${token}`),
          request(app).get('/api/statistics').set('Authorization', `Bearer ${token}`),
        ]);
        expect(deptRes.status).toBe(200);
        expect(courseRes.status).toBe(200);
        expect(statsRes.status).toBe(200);
      }
    });
  });

  describe('Business Logic: Capacity & Prerequisites', () => {
    const bts = Date.now();
    const testDept = `DEPT_${bts}`;
    const prereqCourse = `PREREQ_${bts}`;
    const advancedCourse = `ADV_${bts}`;
    const testStudent1 = `STU1_${bts}`;
    const testStudent2 = `STU2_${bts}`;
    let adminToken: string;

    beforeAll(async () => {
      // Setup isolated test data
      await prisma.department.create({ data: { dept_id: testDept, dept_name: 'Test Dept ' + bts }});
      await prisma.student.create({ data: { student_id: testStudent1, name: 'Student 1', email: `${testStudent1}@test.com`, status: 'Active', year: 1 }});
      await prisma.student.create({ data: { student_id: testStudent2, name: 'Student 2', email: `${testStudent2}@test.com`, status: 'Active', year: 1 }});
      await prisma.course.create({ data: { course_id: prereqCourse, course_name: 'Prereq 101', dept_id: testDept, credits: 3, max_capacity: 5 }});
      await prisma.course.create({ data: { course_id: advancedCourse, course_name: 'Advanced 201', dept_id: testDept, credits: 3, max_capacity: 1, prerequisite_id: prereqCourse }});

      adminToken = (await createAdminAndLogin()).token;
    });

    it('should fail enrollment if prerequisite is not met', async () => {
      const res = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ student_id: testStudent1, course_id: advancedCourse });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Prerequisite not met');
    });

    it('should allow enrollment in prerequisite course', async () => {
      const res = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ student_id: testStudent1, course_id: prereqCourse });
      expect(res.status).toBe(201);
    });

    it('should allow enrollment in advanced course after prerequisite is met', async () => {
      // Mark prereq as Completed first
      await prisma.enrollment.updateMany({
        where: { student_id: testStudent1, course_id: prereqCourse },
        data: { status: 'Completed' }
      });

      const res = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ student_id: testStudent1, course_id: advancedCourse });
      expect(res.status).toBe(201);
    });

    it('should fail enrollment if course capacity is reached', async () => {
      // testStudent2 attempts to enroll in advancedCourse which has a capacity of 1 (already filled by testStudent1)
      await prisma.enrollment.create({
        data: { student_id: testStudent2, course_id: prereqCourse, status: 'Completed' }
      });

      const res = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ student_id: testStudent2, course_id: advancedCourse });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Course is full');
    });
  });
});
