import mongoose from 'mongoose'

const subjectSchema = new mongoose.Schema(
  {
    career: { type: mongoose.Schema.Types.ObjectId, ref: 'Career', required: true },
    year: { type: Number, enum: [1, 2, 3], required: true },
    order: { type: Number, required: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    classroom: { type: String, trim: true, default: '' },
    schedule: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
)

export const Subject = mongoose.model('Subject', subjectSchema)
