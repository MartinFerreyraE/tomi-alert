import mongoose from 'mongoose'

const careerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  },
  { timestamps: true }
)

export const Career = mongoose.model('Career', careerSchema)
