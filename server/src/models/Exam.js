import mongoose from 'mongoose'

const examSchema = new mongoose.Schema(
  {
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    type: { type: String, enum: ['parcial', 'final'], required: true },
    date: { type: Date, required: true },
    inscriptionDeadline: { type: Date },
    classroom: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
)

export const Exam = mongoose.model('Exam', examSchema)
