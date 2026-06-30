import jsPDF from "jspdf";
import "jspdf-autotable";

export const generateStudentTranscript = (student: any) => {
  if (!student) return;

  const doc = new jsPDF();

  // University Header
  doc.setFontSize(22);
  doc.setTextColor(30, 58, 138); // Deep blue
  doc.text("University RDBMS", 105, 20, { align: "center" });
  
  doc.setFontSize(16);
  doc.setTextColor(71, 85, 105);
  doc.text("Official Academic Transcript", 105, 30, { align: "center" });

  doc.setLineWidth(0.5);
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 35, 190, 35);

  // Student Info Section
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(`Student Name: ${student.name || "N/A"}`, 20, 45);
  doc.text(`Student ID: ${student.student_id || "N/A"}`, 120, 45);
  
  doc.text(`Email: ${student.email || "N/A"}`, 20, 52);
  doc.text(`GPA: ${student.gpa !== null ? student.gpa.toFixed(2) : "N/A"}`, 120, 52);

  doc.text(`Department: ${student.department?.dept_name || student.dept_id || "N/A"}`, 20, 59);
  doc.text(`Status: ${student.status || "N/A"}`, 120, 59);

  // Enrollments Table
  const enrollments = student.enrollments || [];
  
  if (enrollments.length > 0) {
    const tableColumn = ["Course ID", "Course Name", "Semester", "Credits", "Grade", "Status"];
    const tableRows: any[] = [];

    enrollments.forEach((en: any) => {
      const course = en.course || {};
      const row = [
        en.course_id,
        course.course_name || "Unknown Course",
        course.semester || "-",
        course.credits || "-",
        en.grade || "-",
        en.status || "Enrolled"
      ];
      tableRows.push(row);
    });

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 70,
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241], textColor: 255 },
      styles: { fontSize: 10, cellPadding: 3 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
  } else {
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text("No course enrollments found for this student.", 20, 75);
  }

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()} - Page ${i} of ${pageCount}`,
      105,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );
  }

  // Save the PDF
  doc.save(`${student.student_id}_Transcript_${new Date().toISOString().split('T')[0]}.pdf`);
};
