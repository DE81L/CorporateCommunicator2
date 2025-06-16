import nodemailer from 'nodemailer';

// Создаём транспорт для Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS // пароль приложения
  }
});

/**
 * Отправка письма через SMTP.
 */
export async function sendMail(to: string, subject: string, text: string) {
  await transporter.sendMail({
    from: `"Nexus Bot" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text
  });
}
