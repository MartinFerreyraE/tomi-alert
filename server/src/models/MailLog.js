import mongoose from 'mongoose'

const mailLogSchema = new mongoose.Schema(
  {
    notice: { type: mongoose.Schema.Types.ObjectId, ref: 'Notice' },
    title: { type: String, trim: true, default: '' },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['enviado', 'omitido', 'error', 'simulado'], required: true },
    detail: { type: String, default: '' },
    body: { type: String, default: '' },
  },
  { timestamps: true }
)

mailLogSchema.index({ createdAt: -1 })
mailLogSchema.index({ status: 1, createdAt: -1 })
mailLogSchema.index({ student: 1, createdAt: -1 })
mailLogSchema.index({ notice: 1, createdAt: -1 })

export const MailLog = mongoose.model('MailLog', mailLogSchema)
