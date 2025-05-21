import nodemailer from 'nodemailer';

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT || 587);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.SMTP_FROM || 'no-reply@example.com';

let transporter: any | null = null;

function getTransport() {
  if (!transporter) {
    if (!host || !user || !pass) {
      throw new Error('SMTP configuration missing');
    }
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }
  return transporter;
}

export async function sendEmailNotification(to: string, subject: string, text: string) {
  const transport = getTransport();
  await transport.sendMail({ from, to, subject, text });
}
