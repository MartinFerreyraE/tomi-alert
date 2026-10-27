import mongoose from 'mongoose'
import { MailLog } from '../models/MailLog.js'
import { Notice } from '../models/Notice.js'
import { User } from '../models/User.js'
import { asyncHandler } from '../http.js'
import { runExamReminders } from '../jobs/reminders.js'

const STATUSES = ['enviado', 'omitido', 'error', 'simulado']
const DAY = /^\d{4}-\d{2}-\d{2}$/

function dayBound(value, end) {
  if (!DAY.test(String(value || ''))) return null
  const date = new Date(`${value}${end ? 'T23:59:59.999-03:00' : 'T00:00:00.000-03:00'}`)
  return Number.isNaN(date.getTime()) ? null : date
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function integerParam(value, fallback, min, max) {
  const number = Number(value)
  if (!Number.isInteger(number)) return fallback
  return Math.min(max, Math.max(min, number))
}

async function mailLogFilter(query) {
  const filter = {}
  if (STATUSES.includes(query.status)) filter.status = query.status
  if (mongoose.isValidObjectId(query.studentId)) filter.student = query.studentId

  const from = dayBound(query.from, false)
  const to = dayBound(query.to, true)
  if (from || to) {
    filter.createdAt = {}
    if (from) filter.createdAt.$gte = from
    if (to) filter.createdAt.$lte = to
  }

  const text = String(query.q || '').trim().slice(0, 80)
  if (text) {
    const regex = new RegExp(escapeRegex(text), 'i')
    const [students, notices] = await Promise.all([
      User.find({
        role: 'alumno',
        $or: [{ name: regex }, { email: regex }, { legajo: regex }],
      }).select('_id'),
      Notice.find({ title: regex }).select('_id'),
    ])
    filter.$or = [
      { title: regex },
      { detail: regex },
      { student: { $in: students.map((item) => item._id) } },
      { notice: { $in: notices.map((item) => item._id) } },
    ]
  }

  return filter
}

export const listMailLogs = asyncHandler(async (req, res) => {
  const limit = integerParam(req.query.limit, 200, 1, 100)
  const page = integerParam(req.query.page, 1, 1, 10000)
  const filter = await mailLogFilter(req.query)
  const [total, items] = await Promise.all([
    MailLog.countDocuments(filter),
    MailLog.find(filter)
      .populate('student', 'name email legajo')
      .populate('notice', 'title type')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
  ])
  res.json({ items, total, page, limit })
})

export const runReminders = asyncHandler(async (_req, res) => {
  const result = await runExamReminders()
  res.json(result)
})
