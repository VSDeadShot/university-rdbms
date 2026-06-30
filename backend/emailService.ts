import nodemailer from 'nodemailer';

// Use Ethereal Email for testing (creates a fake SMTP service)
// In a real production app, you would use SendGrid, AWS SES, or standard SMTP
let transporter: nodemailer.Transporter | null = null;

const initializeTransporter = async () => {
  try {
    const testAccount = await nodemailer.createTestAccount();
    
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log("✉️ Ethereal Email Transporter initialized. Ready to send emails.");
  } catch (error) {
    console.error("Failed to initialize Ethereal Email Transporter", error);
  }
};

// Initialize once when the service is loaded
initializeTransporter();

export const sendWelcomeEmail = async (userEmail: string, userName: string) => {
  if (!transporter) return;
  
  try {
    const info = await transporter.sendMail({
      from: '"University RDBMS" <noreply@university.edu>',
      to: userEmail,
      subject: "Welcome to University RDBMS! 🎉",
      html: `
        <h2>Welcome ${userName}!</h2>
        <p>Your account has been successfully created in the University RDBMS.</p>
        <p>You can now log in to view your courses, enrollments, and academic progress.</p>
        <br/>
        <p>Best regards,</p>
        <p><strong>University Administration</strong></p>
      `,
    });
    
    console.log(`✉️ Welcome email sent to ${userEmail}`);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error(`Failed to send welcome email to ${userEmail}`, error);
  }
};

export const sendGradeUpdateEmail = async (studentEmail: string, studentName: string, courseName: string, newGrade: string) => {
  if (!transporter) return;
  
  try {
    const info = await transporter.sendMail({
      from: '"University RDBMS" <noreply@university.edu>',
      to: studentEmail,
      subject: "New Grade Posted 🎓",
      html: `
        <h2>Hello ${studentName},</h2>
        <p>Your grade for <strong>${courseName}</strong> has been updated.</p>
        <p>Your new grade is: <strong>${newGrade}</strong></p>
        <p>Log in to the dashboard to download your updated transcript.</p>
        <br/>
        <p>Best regards,</p>
        <p><strong>University Administration</strong></p>
      `,
    });
    
    console.log(`✉️ Grade update email sent to ${studentEmail}`);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error(`Failed to send grade update email to ${studentEmail}`, error);
  }
};
