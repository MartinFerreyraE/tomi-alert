import { Notice } from '../models/Notice.js'
import { Subject } from '../models/Subject.js'
import { Enrollment } from '../models/Enrollment.js'
import { User } from '../models/User.js'
import { asyncHandler, httpError } from '../http.js'
import { deliverToStudent, fanOutNotice } from '../services/notifyService.js'

const TYPES = ['horario', 'aula', 'personalizado']

async function resolveRecipients({ type, subjectId, recipientIds }) {
  if (type === 'personalizado') {
    if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
      throw httpError(400, 'Elegí al menos un alumno.')
    }
    const students = await User.find({ _id: { $in: recipientIds }, role: 'alumno' })
    if (!students.length) throw httpError(400, 'No se encontraron alumnos.')
    return { students, subject: null }
  }
  if (!subjectId) throw httpError(400, 'Elegí una materia.')
  const subject = await Subject.findById(subjectId)
  if (!subject) throw httpError(404, 'Materia no encontrada.')
  const enrollments = await Enrollment.find({ subject: subjectId })
  const students = await User.find({ _id: { $in: enrollments.map((item) => item.student) } })
  if (!students.length) throw httpError(400, 'Esa materia no tiene alumnos inscriptos.')
  return { students, subject }
}

export const listNotices = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { recipients: req.user._id }
  const notices = await Notice.find(filter)
    .populate('subject', 'code name')
    .populate('author', 'name')
    .populate('recipients', 'name email legajo')
    .sort({ createdAt: -1 })
  res.json(notices)
})

export const createNotice = asyncHandler(async (req, res) => {
  const title = String(req.body.title || '').trim()
  const body = String(req.body.body || '').trim()
  const type = req.body.type
  if (!title || !body) throw httpError(400, 'Título y mensaje son obligatorios.')
  if (!TYPES.includes(type)) throw httpError(400, 'Tipo de aviso inválido.')
  const { students, subject } = await resolveRecipients({
    type,
    subjectId: req.body.subjectId,
    recipientIds: req.body.recipientIds,
  })
  const notice = await Notice.create({
    title,
    body,
    type,
    subject: subject?._id,
    recipients: students.map((student) => student._id),
    author: req.user._id,
  })
  await fanOutNotice({ notice, students, subjectName: subject?.name })
  const populated = await Notice.findById(notice._id)
    .populate('subject', 'code name')
    .populate('author', 'name')
    .populate('recipients', 'name email legajo')
  res.status(201).json(populated)
})

export const resendNotice = asyncHandler(async (req, res) => {
  const notice = await Notice.findById(req.params.id).populate('subject', 'name')
  if (!notice) throw httpError(404, 'Aviso no encontrado.')
  const students = await User.find({ _id: { $in: notice.recipients } })
  const { buildNoticeMessage } = await import('../chat/engine.js')
  const text = buildNoticeMessage(notice, notice.subject?.name)
  const title = notice.subject?.name ? `${notice.title} (${notice.subject.name})` : notice.title
  for (const student of students) {
    await deliverToStudent({ student, title, text, noticeId: notice._id })
  }
  res.json({ ok: true, recipients: students.length })
})
