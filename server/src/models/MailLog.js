import mongoose from 'mongoose'

const mailLogSchema = new mongoose.Schema(
  {
    notice: { type: mongoose.Schema.Types.ObjectId, ref: 'Notice', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['enviado', 'omitido', 'error', 'simulado'], required: true },
    detail: { type: String, default: '' },
    body: { type: String, default: '' },
  },
  { timestamps: true }
)

export const MailLog = mongoose.model('MailLog', mailLogSchema)
