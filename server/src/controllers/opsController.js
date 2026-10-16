import { MailLog } from '../models/MailLog.js'
import { asyncHandler } from '../http.js'
import { runExamReminders } from '../jobs/reminders.js'

export const listMailLogs = asyncHandler(async (_req, res) => {
  const logs = await MailLog.find()
    .populate('student', 'name email legajo')
    .populate('notice', 'title type')
    .sort({ createdAt: -1 })
    .limit(200)
  res.json(logs)
})

export const runReminders = asyncHandler(async (_req, res) => {
  const result = await runExamReminders()
  res.json(result)
})
