import mongoose from 'mongoose'

const enrollmentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    status: { type: String, enum: ['cursando', 'regular'], required: true },
    inscribedToExam: { type: Boolean, default: false },
  },
  { timestamps: true }
)

enrollmentSchema.index({ student: 1, subject: 1 }, { unique: true })

export const Enrollment = mongoose.model('Enrollment', enrollmentSchema)
