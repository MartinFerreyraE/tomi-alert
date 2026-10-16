import mongoose from 'mongoose'

const conversationSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    pendingIntent: { type: String, default: null },
  },
  { timestamps: true }
)

export const Conversation = mongoose.model('Conversation', conversationSchema)
