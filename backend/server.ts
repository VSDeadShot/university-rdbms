import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ==================== HOME ROUTE ====================
app.get('/', (req, res) => {
  res.send('University Management API is running (Node.js + Prisma)');
});

// ==================== STUDENT ROUTES ====================

app.get('/api/students', async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      include: { department: true },
      orderBy: { student_id: 'asc' },
    });
    const formattedStudents = students.map(s => ({
      ...s,
      dept_name: s.department?.dept_name,
      department: undefined
    }));
    res.json(formattedStudents);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

app.get('/api/students/:id', async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { student_id: req.params.id },
      include: { 
        department: true,
        enrollments: {
          include: { course: true }
        }
      }
    });
    if (!student) return res.status(404).json({ error: "Student not found" });
    res.json(student);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch student" });
  }
});

app.post('/api/students', async (req, res) => {
  try {
    const data = req.body;
    if (!data.student_id || !data.name || !data.email || !data.dept_id || !data.year) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const newStudent = await prisma.student.create({
      data: {
        student_id: data.student_id,
        name: data.name,
        email: data.email,
        dept_id: data.dept_id,
        year: parseInt(data.year),
        gpa: data.gpa ? parseFloat(data.gpa) : null,
        phone: data.phone || null,
        date_of_birth: data.date_of_birth ? new Date(data.date_of_birth) : null,
        status: data.status || 'Active'
      }
    });
    res.status(201).json({ success: true, message: 'Student added successfully!', student: newStudent });
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(400).json({ error: "Student ID or Email already exists" });
    res.status(500).json({ error: "Failed to add student" });
  }
});

app.put('/api/students/:id', async (req, res) => {
  try {
    const data = req.body;
    const updatedStudent = await prisma.student.update({
      where: { student_id: req.params.id },
      data: {
        name: data.name,
        email: data.email,
        dept_id: data.dept_id,
        year: parseInt(data.year),
        gpa: data.gpa ? parseFloat(data.gpa) : null,
        phone: data.phone || null,
        date_of_birth: data.date_of_birth ? new Date(data.date_of_birth) : null,
        status: data.status || 'Active'
      }
    });
    res.json({ success: true, message: "Student updated successfully!", student: updatedStudent });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: "Student not found" });
    }
    res.status(500).json({ error: "Failed to update student" });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  try {
    await prisma.enrollment.deleteMany({ where: { student_id: req.params.id } });
    await prisma.student.delete({ where: { student_id: req.params.id } });
    res.json({ success: true, message: "Student deleted successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete student" });
  }
});

// ==================== DEPARTMENT ROUTES ====================
app.get('/api/departments', async (req, res) => {
  try {
    const departments = await prisma.department.findMany({ orderBy: { dept_name: 'asc' } });
    res.json(departments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch departments" });
  }
});

// ==================== COURSE ROUTES ====================
app.get('/api/courses', async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      include: { department: true },
      orderBy: { course_id: 'asc' }
    });
    const formattedCourses = courses.map(c => ({
      ...c,
      dept_name: c.department?.dept_name,
      department: undefined
    }));
    res.json(formattedCourses);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

app.post('/api/courses', async (req, res) => {
  try {
    const data = req.body;
    await prisma.course.create({
      data: {
        course_id: data.course_id,
        course_name: data.course_name,
        dept_id: data.dept_id,
        credits: parseInt(data.credits),
        instructor: data.instructor,
        semester: data.semester,
        max_capacity: parseInt(data.max_capacity) || 60,
        room_number: data.room_number || null
      }
    });
    res.status(201).json({ success: true, message: "Course added successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Failed to add course" });
  }
});

app.put('/api/courses/:id', async (req, res) => {
  try {
    const data = req.body;
    await prisma.course.update({
      where: { course_id: req.params.id },
      data: {
        course_name: data.course_name,
        dept_id: data.dept_id,
        credits: parseInt(data.credits),
        instructor: data.instructor,
        semester: data.semester,
        max_capacity: parseInt(data.max_capacity) || 60,
        room_number: data.room_number || null
      }
    });
    res.json({ success: true, message: "Course updated successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update course" });
  }
});

// ==================== ENROLLMENT ROUTES ====================
app.get('/api/enrollments', async (req, res) => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      include: { student: true, course: true },
      orderBy: { enrollment_date: 'desc' }
    });
    const formatted = enrollments.map(e => ({
      ...e,
      student_name: e.student?.name,
      course_name: e.course?.course_name,
      student: undefined,
      course: undefined
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch enrollments" });
  }
});

app.post('/api/enrollments', async (req, res) => {
  try {
    const data = req.body;
    await prisma.enrollment.create({
      data: {
        student_id: data.student_id,
        course_id: data.course_id,
        grade: data.grade || null,
        attendance_percentage: data.attendance_percentage ? parseFloat(data.attendance_percentage) : 0,
        status: data.status || 'Enrolled'
      }
    });
    res.status(201).json({ success: true, message: "Enrollment added successfully!" });
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(400).json({ error: "Student is already enrolled in this course" });
    res.status(500).json({ error: "Failed to add enrollment" });
  }
});

app.put('/api/enrollments/:id', async (req, res) => {
  try {
    const data = req.body;
    await prisma.enrollment.update({
      where: { enrollment_id: parseInt(req.params.id) },
      data: {
        grade: data.grade || null,
        attendance_percentage: data.attendance_percentage ? parseFloat(data.attendance_percentage) : 0,
        status: data.status || 'Enrolled'
      }
    });
    res.json({ success: true, message: "Enrollment updated successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update enrollment" });
  }
});

// ==================== STATISTICS ROUTES ====================
app.get('/api/statistics', async (req, res) => {
  try {
    const totalStudents = await prisma.student.count({ where: { status: 'Active' } });
    const totalDepartments = await prisma.department.count();
    const totalCourses = await prisma.course.count();
    
    const studentsWithGpa = await prisma.student.findMany({ 
      where: { status: 'Active', gpa: { not: null } },
      select: { gpa: true }
    });
    const avgGpa = studentsWithGpa.length > 0 
      ? studentsWithGpa.reduce((acc, curr) => acc + (curr.gpa || 0), 0) / studentsWithGpa.length 
      : 0;

    const topStudents = await prisma.student.findMany({
      where: { status: 'Active' },
      orderBy: { gpa: 'desc' },
      take: 5
    });

    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { students: { where: { status: 'Active' } } }
        }
      }
    });
    const departmentDistribution = departments.map(d => ({
      dept_name: d.dept_name,
      student_count: d._count.students
    })).sort((a, b) => b.student_count - a.student_count);

    const courses = await prisma.course.findMany({
      include: {
        _count: { select: { enrollments: true } }
      }
    });
    const popularCourses = courses.map(c => ({
      course_name: c.course_name,
      enrolled_count: c._count.enrollments
    })).sort((a, b) => b.enrolled_count - a.enrolled_count).slice(0, 5);

    res.json({
      total_students: totalStudents,
      total_departments: totalDepartments,
      total_courses: totalCourses,
      average_gpa: parseFloat(avgGpa.toFixed(2)),
      top_students: topStudents,
      department_distribution: departmentDistribution,
      popular_courses: popularCourses
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 MODERN BACKEND STARTED ON HTTP://LOCALHOST:${PORT}`);
  console.log(`=================================================`);
});