import { Preference } from '../models/Preference.js'
import { MailLog } from '../models/MailLog.js'
import { sendMail } from './mailService.js'
import { appendTomiMessage } from './chatService.js'
import { buildNoticeMessage, buildGradeMessage } from '../chat/engine.js'

async function preferenceFor(studentId) {
  const preference = await Preference.findOne({ student: studentId })
  return {
    emailEnabled: preference ? preference.emailEnabled : true,
    tomiEnabled: preference ? preference.tomiEnabled : true,
  }
}

export async function fanOutNotice({ notice, students, subjectName }) {
  const text = buildNoticeMessage(notice, subjectName)
  const subjectLine = subjectName ? `${notice.title} (${subjectName})` : notice.title
  for (const student of students) {
    const preference = await preferenceFor(student._id)
    if (preference.emailEnabled) {
      const result = await sendMail({ to: student.email, subject: subjectLine, text })
      await MailLog.create({
        notice: notice._id,
        student: student._id,
        status: result.status,
        detail: result.detail,
        body: text,
      })
    } else {
      await MailLog.create({
        notice: notice._id,
        student: student._id,
        status: 'omitido',
        detail: 'El alumno desactivó las notificaciones por email.',
        body: text,
      })
    }
    if (preference.tomiEnabled) {
      await appendTomiMessage(student._id, text, { kind: 'notice', noticeId: String(notice._id) })
    }
  }
}

export async function notifyGrade({ studentId, subjectName, instance, score }) {
  const preference = await preferenceFor(studentId)
  if (!preference.tomiEnabled) return null
  const text = buildGradeMessage({ subjectName, instance, score })
  return appendTomiMessage(studentId, text, { kind: 'grade' })
}
