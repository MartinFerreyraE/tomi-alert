import mongoose from 'mongoose'

const preferenceSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    emailEnabled: { type: Boolean, default: true },
    tomiEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export const Preference = mongoose.model('Preference', preferenceSchema)
