import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    author: { type: String, enum: ['alumno', 'tomi'], required: true },
    text: { type: String, required: true },
    proactive: { type: Boolean, default: false },
    read: { type: Boolean, default: false },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
)

export const Message = mongoose.model('Message', messageSchema)
