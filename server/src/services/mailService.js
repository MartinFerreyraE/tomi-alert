import nodemailer from 'nodemailer'

let transporter

async function getTransporter() {
  if (transporter) return transporter
  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    })
    return transporter
  }
  const testAccount = await nodemailer.createTestAccount()
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  })
  return transporter
}

export async function sendMail({ to, subject, text }) {
  if (process.env.SKIP_SMTP === 'true') {
    return { status: 'simulado', detail: 'Envío simulado. Configurá SMTP para mandarlo de verdad.' }
  }
  try {
    const tx = await getTransporter()
    const info = await tx.sendMail({
      from: process.env.MAIL_FROM || 'Tomi-Alert <no-reply@tomi-alert.edu>',
      to,
      subject,
      text,
    })
    const preview = nodemailer.getTestMessageUrl(info)
    return { status: 'enviado', detail: preview || info.messageId || 'enviado' }
  } catch (error) {
    return {
      status: 'simulado',
      detail: `No se pudo contactar al servidor de correo (${error.message}). El aviso quedó registrado.`,
    }
  }
}
