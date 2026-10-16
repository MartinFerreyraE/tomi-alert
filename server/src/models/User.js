import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    document: { type: String, required: true, unique: true, lowercase: true, trim: true },
    documentType: { type: String, enum: ['dni', 'pasaporte'] },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'alumno'], required: true },
    legajo: { type: String, trim: true },
  },
  { timestamps: true }
)

export const User = mongoose.model('User', userSchema)
