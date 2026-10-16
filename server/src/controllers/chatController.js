import { Message } from '../models/Message.js'
import { asyncHandler, httpError } from '../http.js'
import { QUICK_REPLIES, handleTurn } from '../chat/engine.js'
import { buildContext, getOrCreateConversation } from '../services/chatService.js'

export const listMessages = asyncHandler(async (req, res) => {
  const conversation = await getOrCreateConversation(req.user._id)
  const messages = await Message.find({ conversation: conversation._id }).sort({ createdAt: 1 })
  const unread = messages.filter((message) => message.author === 'tomi' && !message.read).length
  const last = messages[messages.length - 1]
  const quickReplies = last?.meta?.quickReplies?.length ? last.meta.quickReplies : QUICK_REPLIES
  res.json({
    messages,
    pendingIntent: conversation.pendingIntent,
    unread,
    quickReplies,
  })
})

export const postMessage = asyncHandler(async (req, res) => {
  const text = String(req.body.text || '').trim()
  if (!text) throw httpError(400, 'Escribí un mensaje.')
  if (text.length > 500) throw httpError(400, 'El mensaje es demasiado largo.')
  const conversation = await getOrCreateConversation(req.user._id)
  await Message.create({
    conversation: conversation._id,
    author: 'alumno',
    text,
    proactive: false,
    read: true,
  })
  const context = await buildContext(req.user._id)
  const result = handleTurn({
    text,
    pendingIntent: conversation.pendingIntent,
    subjects: context.subjects,
    context,
  })
  conversation.pendingIntent = result.pendingIntent
  await conversation.save()
  const reply = await Message.create({
    conversation: conversation._id,
    author: 'tomi',
    text: result.reply,
    proactive: false,
    read: true,
    meta: { quickReplies: result.quickReplies },
  })
  res.json({ reply, quickReplies: result.quickReplies })
})

export const markRead = asyncHandler(async (req, res) => {
  const conversation = await getOrCreateConversation(req.user._id)
  await Message.updateMany({ conversation: conversation._id, author: 'tomi', read: false }, { read: true })
  res.json({ ok: true })
})
