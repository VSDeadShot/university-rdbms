import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server';

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
    
    // Validate the shape of the department object if data exists
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty('dept_id');
      expect(res.body[0]).toHaveProperty('dept_name');
    }
  });

  it('GET /api/students should return a list of students', async () => {
    const res = await request(app).get('/api/students');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
