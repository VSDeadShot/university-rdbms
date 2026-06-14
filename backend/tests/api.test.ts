import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('University API Integration Tests', () => {
  it('GET / should return running message', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('University Management API is running');
  });

  it('GET /api/departments should return a list of departments', async () => {
    const res = await request(app).get('/api/departments');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
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
  });

  describe('Business Logic: Capacity & Prerequisites', () => {
    const ts = Date.now();
    const testDept = `DEPT_${ts}`;
    const prereqCourse = `PREREQ_${ts}`;
    const advancedCourse = `ADV_${ts}`;
    const testStudent1 = `STU1_${ts}`;
    const testStudent2 = `STU2_${ts}`;

    beforeAll(async () => {
      // Setup isolated test data
      await prisma.department.create({ data: { dept_id: testDept, dept_name: 'Test Dept ' + ts }});
      await prisma.student.create({ data: { student_id: testStudent1, name: 'Student 1', email: `${testStudent1}@test.com`, status: 'Active', year: 1 }});
      await prisma.student.create({ data: { student_id: testStudent2, name: 'Student 2', email: `${testStudent2}@test.com`, status: 'Active', year: 1 }});
      await prisma.course.create({ data: { course_id: prereqCourse, course_name: 'Prereq 101', dept_id: testDept, credits: 3, max_capacity: 5 }});
      await prisma.course.create({ data: { course_id: advancedCourse, course_name: 'Advanced 201', dept_id: testDept, credits: 3, max_capacity: 1, prerequisite_id: prereqCourse }});
    });

    it('should fail enrollment if prerequisite is not met', async () => {
      const res = await request(app)
        .post('/api/enrollments')
        .send({ student_id: testStudent1, course_id: advancedCourse });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Prerequisite not met');
    });

    it('should allow enrollment in prerequisite course', async () => {
      const res = await request(app)
        .post('/api/enrollments')
        .send({ student_id: testStudent1, course_id: prereqCourse });
      expect(res.status).toBe(201);
    });

    it('should allow enrollment in advanced course after prerequisite is met', async () => {
      const res = await request(app)
        .post('/api/enrollments')
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
        .send({ student_id: testStudent2, course_id: advancedCourse });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Course is full');
    });
  });
});
