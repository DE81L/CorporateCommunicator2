// Используем локальную заглушку вместо зависимости nodemailer
import nodemailer from '../stubs/nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? 'localhost',
  port: Number(process.env.SMTP_PORT ?? 25),
  secure: false,
})

/**
 * Отправить email-сообщение пользователю.
 */
export async function sendMail(to: string, subject: string, body: string): Promise<void> {
  await transporter.sendMail({
    from: process.env.MAIL_FROM ?? 'noreply@example.com',
    to,
    subject,
    text: body,
  })
}
