// Простая заглушка Nodemailer для офлайн-среды
// Позволяет отправлять письма только в лог
export interface Transporter {
  sendMail(options: { from?: string; to: string; subject: string; text: string }): Promise<void>
}

export function createTransport(_config: any): Transporter {
  return {
    async sendMail(options) {
      console.log('Mock sendMail', options)
    }
  }
}

export default { createTransport }
