import { Exam } from '../models/Exam.js'
import { Enrollment } from '../models/Enrollment.js'
import { Preference } from '../models/Preference.js'
import { Subject } from '../models/Subject.js'
import { Message } from '../models/Message.js'
import { buildExamReminder } from '../chat/engine.js'
import { appendTomiMessage, getOrCreateConversation } from '../services/chatService.js'

export async function runExamReminders() {
  const now = new Date()
  const limit = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const exams = await Exam.find({
    type: 'final',
    inscriptionDeadline: { $gte: now, $lte: limit },
  })
  let created = 0
  for (const exam of exams) {
    const subject = await Subject.findById(exam.subject)
    if (!subject) continue
    const enrollments = await Enrollment.find({
      subject: exam.subject,
      status: 'regular',
      inscribedToExam: false,
    })
    for (const enrollment of enrollments) {
      const preference = await Preference.findOne({ student: enrollment.student })
      if (preference && preference.tomiEnabled === false) continue
      const conversation = await getOrCreateConversation(enrollment.student)
      const exists = await Message.findOne({
        conversation: conversation._id,
        'meta.kind': 'exam-reminder',
        'meta.examId': String(exam._id),
      })
      if (exists) continue
      await appendTomiMessage(
        enrollment.student,
        buildExamReminder({ subjectName: subject.name, deadline: exam.inscriptionDeadline }),
        { kind: 'exam-reminder', examId: String(exam._id) }
      )
      created += 1
    }
  }
  return { created }
}
