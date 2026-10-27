import { Preference } from '../models/Preference.js'
import { MailLog } from '../models/MailLog.js'
import { User } from '../models/User.js'
import { Subject } from '../models/Subject.js'
import { Enrollment } from '../models/Enrollment.js'
import { sendMail } from './mailService.js'
import { appendTomiMessage } from './chatService.js'
import { buildNoticeMessage, buildGradeMessage, buildExamChangeMessage } from '../chat/engine.js'

async function preferenceFor(studentId) {
  const preference = await Preference.findOne({ student: studentId })
  return {
    emailEnabled: preference ? preference.emailEnabled : true,
    tomiEnabled: preference ? preference.tomiEnabled : true,
  }
}

export async function deliverToStudent({ student, title, text, noticeId, tomiMeta }) {
  const preference = await preferenceFor(student._id)
  if (preference.emailEnabled) {
    const result = await sendMail({ to: student.email, subject: title, text })
    await MailLog.create({
      ...(noticeId ? { notice: noticeId } : {}),
      title,
      student: student._id,
      status: result.status,
      detail: result.detail,
      body: text,
    })
  } else {
    await MailLog.create({
      ...(noticeId ? { notice: noticeId } : {}),
      title,
      student: student._id,
      status: 'omitido',
      detail: 'El alumno desactivó las notificaciones por email.',
      body: text,
    })
  }
  if (preference.tomiEnabled && tomiMeta) {
    await appendTomiMessage(student._id, text, tomiMeta)
  }
}

export async function fanOutNotice({ notice, students, subjectName }) {
  const text = buildNoticeMessage(notice, subjectName)
  const title = subjectName ? `${notice.title} (${subjectName})` : notice.title
  for (const student of students) {
    await deliverToStudent({
      student,
      title,
      text,
      noticeId: notice._id,
      tomiMeta: { kind: 'notice', noticeId: String(notice._id) },
    })
  }
}

function examChangeTitle(action, type, subjectName) {
  const kind = type === 'final' ? 'final' : 'parcial'
  if (action === 'creado') return `Nuevo ${kind} en ${subjectName}`
  if (action === 'borrado') return `Se eliminó el ${kind} de ${subjectName}`
  return `Cambios en el ${kind} de ${subjectName}`
}

export async function notifyExamChange({ subjectId, action, type, date, inscriptionDeadline, classroom }) {
  const subject = await Subject.findById(subjectId)
  const subjectName = subject?.name || 'la materia'
  const text = buildExamChangeMessage({ action, subjectName, type, date, inscriptionDeadline, classroom })
  const title = examChangeTitle(action, type, subjectName)
  const enrollments = await Enrollment.find({ subject: subjectId })
  if (!enrollments.length) return
  const students = await User.find({ _id: { $in: enrollments.map((item) => item.student) } })
  for (const student of students) {
    await deliverToStudent({
      student,
      title,
      text,
      tomiMeta: { kind: 'exam-change', action },
    })
  }
}

export async function notifyGrade({ studentId, subjectName, instance, score }) {
  const student = await User.findById(studentId)
  if (!student) return null
  const text = buildGradeMessage({ subjectName, instance, score })
  const title = `Nota de ${instance} en ${subjectName}`
  await deliverToStudent({
    student,
    title,
    text,
    tomiMeta: { kind: 'grade' },
  })
  return text
}
