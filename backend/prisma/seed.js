import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    console.log('Seeding database...');
    const departments = [
        { dept_id: 'CSE', dept_name: 'Computer Science', head_of_dept: 'Dr. Rajesh Kumar', building: 'Tech Block A', budget: 5000000.00, established_year: 1995 },
        { dept_id: 'ECE', dept_name: 'Electronics', head_of_dept: 'Dr. Priya Sharma', building: 'Tech Block B', budget: 4500000.00, established_year: 1998 },
        { dept_id: 'MECH', dept_name: 'Mechanical', head_of_dept: 'Dr. Vikram Singh', building: 'Engineering Block', budget: 6000000.00, established_year: 1990 },
        { dept_id: 'CIVIL', dept_name: 'Civil Engineering', head_of_dept: 'Dr. Anita Desai', building: 'Civil Block', budget: 5500000.00, established_year: 1992 },
        { dept_id: 'EEE', dept_name: 'Electrical', head_of_dept: 'Dr. Suresh Reddy', building: 'Tech Block C', budget: 4800000.00, established_year: 1996 },
    ];
    for (const dept of departments) {
        await prisma.department.create({ data: dept });
    }
    const students = [
        { student_id: 'S001', name: 'Rahul Sharma', email: 'rahul.sharma@university.edu', dept_id: 'CSE', year: 2, gpa: 8.75, date_of_birth: new Date('2004-03-15'), phone: '9876543210', address: 'Mumbai, Maharashtra', status: 'Active' },
        { student_id: 'S002', name: 'Priya Patel', email: 'priya.patel@university.edu', dept_id: 'ECE', year: 3, gpa: 9.20, date_of_birth: new Date('2003-07-22'), phone: '9876543211', address: 'Ahmedabad, Gujarat', status: 'Active' },
        { student_id: 'S003', name: 'Amit Kumar', email: 'amit.kumar@university.edu', dept_id: 'MECH', year: 1, gpa: 7.45, date_of_birth: new Date('2005-11-08'), phone: '9876543212', address: 'Delhi, Delhi', status: 'Active' },
        { student_id: 'S004', name: 'Sneha Reddy', email: 'sneha.reddy@university.edu', dept_id: 'CSE', year: 4, gpa: 8.88, date_of_birth: new Date('2002-01-30'), phone: '9876543213', address: 'Hyderabad, Telangana', status: 'Active' },
        { student_id: 'S005', name: 'Arjun Singh', email: 'arjun.singh@university.edu', dept_id: 'CIVIL', year: 2, gpa: 8.10, date_of_birth: new Date('2004-09-12'), phone: '9876543214', address: 'Jaipur, Rajasthan', status: 'Active' },
        { student_id: 'S006', name: 'Ananya Iyer', email: 'ananya.iyer@university.edu', dept_id: 'ECE', year: 3, gpa: 9.50, date_of_birth: new Date('2003-05-18'), phone: '9876543215', address: 'Chennai, Tamil Nadu', status: 'Active' },
        { student_id: 'S007', name: 'Vikram Mehta', email: 'vikram.mehta@university.edu', dept_id: 'MECH', year: 1, gpa: 7.20, date_of_birth: new Date('2005-12-25'), phone: '9876543216', address: 'Pune, Maharashtra', status: 'Active' },
        { student_id: 'S008', name: 'Divya Nair', email: 'divya.nair@university.edu', dept_id: 'CSE', year: 2, gpa: 8.70, date_of_birth: new Date('2004-04-10'), phone: '9876543217', address: 'Kochi, Kerala', status: 'Active' },
        { student_id: 'S009', name: 'Rohan Gupta', email: 'rohan.gupta@university.edu', dept_id: 'EEE', year: 3, gpa: 8.35, date_of_birth: new Date('2003-08-20'), phone: '9876543218', address: 'Bangalore, Karnataka', status: 'Active' },
        { student_id: 'S010', name: 'Kavya Krishnan', email: 'kavya.k@university.edu', dept_id: 'CIVIL', year: 4, gpa: 9.00, date_of_birth: new Date('2002-02-14'), phone: '9876543219', address: 'Trivandrum, Kerala', status: 'Active' },
    ];
    for (const student of students) {
        await prisma.student.create({ data: student });
    }
    const courses = [
        { course_id: 'CSE101', course_name: 'Introduction to Programming', dept_id: 'CSE', credits: 4, instructor: 'Prof. Ramesh Patel', semester: 'Fall 2024', max_capacity: 60, room_number: 'A-101' },
        { course_id: 'CSE201', course_name: 'Data Structures', dept_id: 'CSE', credits: 4, instructor: 'Prof. Meera Shah', semester: 'Fall 2024', max_capacity: 50, room_number: 'A-102' },
        { course_id: 'CSE301', course_name: 'Database Management Systems', dept_id: 'CSE', credits: 3, instructor: 'Prof. Anil Verma', semester: 'Spring 2024', max_capacity: 55, room_number: 'A-103' },
        { course_id: 'CSE401', course_name: 'Artificial Intelligence', dept_id: 'CSE', credits: 4, instructor: 'Dr. Rajesh Kumar', semester: 'Spring 2024', max_capacity: 45, room_number: 'A-104' },
        { course_id: 'ECE101', course_name: 'Circuit Theory', dept_id: 'ECE', credits: 3, instructor: 'Prof. Lakshmi Menon', semester: 'Fall 2024', max_capacity: 60, room_number: 'B-201' },
        { course_id: 'ECE201', course_name: 'Digital Electronics', dept_id: 'ECE', credits: 4, instructor: 'Dr. Priya Sharma', semester: 'Fall 2024', max_capacity: 50, room_number: 'B-202' },
        { course_id: 'MECH101', course_name: 'Engineering Mechanics', dept_id: 'MECH', credits: 4, instructor: 'Prof. Kiran Joshi', semester: 'Fall 2024', max_capacity: 65, room_number: 'C-301' },
        { course_id: 'MECH201', course_name: 'Thermodynamics', dept_id: 'MECH', credits: 3, instructor: 'Dr. Vikram Singh', semester: 'Spring 2024', max_capacity: 60, room_number: 'C-302' },
        { course_id: 'CIVIL101', course_name: 'Surveying', dept_id: 'CIVIL', credits: 3, instructor: 'Prof. Sunil Rao', semester: 'Fall 2024', max_capacity: 55, room_number: 'D-401' },
        { course_id: 'EEE101', course_name: 'Electrical Circuits', dept_id: 'EEE', credits: 4, instructor: 'Dr. Suresh Reddy', semester: 'Fall 2024', max_capacity: 60, room_number: 'E-501' },
    ];
    for (const course of courses) {
        await prisma.course.create({ data: course });
    }
    const enrollments = [
        { student_id: 'S001', course_id: 'CSE101', grade: 'A', attendance_percentage: 92.50, status: 'Completed' },
        { student_id: 'S001', course_id: 'CSE201', grade: 'A-', attendance_percentage: 88.00, status: 'Enrolled' },
        { student_id: 'S002', course_id: 'ECE101', grade: 'A+', attendance_percentage: 95.00, status: 'Completed' },
        { student_id: 'S002', course_id: 'ECE201', grade: 'A', attendance_percentage: 90.50, status: 'Enrolled' },
        { student_id: 'S003', course_id: 'MECH101', grade: 'B+', attendance_percentage: 82.00, status: 'Enrolled' },
        { student_id: 'S004', course_id: 'CSE301', grade: 'A', attendance_percentage: 91.00, status: 'Enrolled' },
        { student_id: 'S004', course_id: 'CSE401', grade: 'A+', attendance_percentage: 96.00, status: 'Completed' },
        { student_id: 'S005', course_id: 'CIVIL101', grade: 'B', attendance_percentage: 80.00, status: 'Enrolled' },
        { student_id: 'S006', course_id: 'ECE201', grade: 'A+', attendance_percentage: 98.00, status: 'Enrolled' },
        { student_id: 'S007', course_id: 'MECH101', grade: 'B', attendance_percentage: 78.50, status: 'Enrolled' },
        { student_id: 'S008', course_id: 'CSE201', grade: 'A-', attendance_percentage: 87.00, status: 'Enrolled' },
        { student_id: 'S009', course_id: 'EEE101', grade: 'B+', attendance_percentage: 84.00, status: 'Enrolled' },
        { student_id: 'S010', course_id: 'CIVIL101', grade: 'A', attendance_percentage: 89.50, status: 'Completed' },
    ];
    for (const enrollment of enrollments) {
        await prisma.enrollment.create({ data: enrollment });
    }
    console.log('Database seeded successfully!');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map