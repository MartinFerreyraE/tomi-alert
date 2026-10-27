import mongoose from 'mongoose'

const noticeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    type: { type: String, enum: ['horario', 'aula', 'personalizado'], required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
)

export const Notice = mongoose.model('Notice', noticeSchema)
