import mongoose from 'mongoose'

const gradeSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    instance: { type: String, enum: ['parcial', 'recuperatorio', 'final'], required: true },
    score: { type: Number, required: true, min: 0, max: 10 },
    loadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

export const Grade = mongoose.model('Grade', gradeSchema)
