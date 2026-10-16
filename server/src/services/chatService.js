import { Conversation } from '../models/Conversation.js'
import { Message } from '../models/Message.js'
import { Subject } from '../models/Subject.js'
import { Enrollment } from '../models/Enrollment.js'
import { Grade } from '../models/Grade.js'
import { Exam } from '../models/Exam.js'
import { Notice } from '../models/Notice.js'

export async function getOrCreateConversation(studentId) {
  let conversation = await Conversation.findOne({ student: studentId })
  if (!conversation) conversation = await Conversation.create({ student: studentId, pendingIntent: null })
  return conversation
}

export async function appendTomiMessage(studentId, text, meta = {}, proactive = true) {
  const conversation = await getOrCreateConversation(studentId)
  return Message.create({
    conversation: conversation._id,
    author: 'tomi',
    text,
    proactive,
    read: false,
    meta,
  })
}

export async function buildContext(studentId) {
  const [subjects, enrollments, grades, notices] = await Promise.all([
    Subject.find().lean(),
    Enrollment.find({ student: studentId }).lean(),
    Grade.find({ student: studentId }).lean(),
    Notice.find({ recipients: studentId }).sort({ createdAt: -1 }).limit(8).lean(),
  ])
  const enrolledIds = enrollments.map((item) => item.subject)
  const exams = await Exam.find({ subject: { $in: enrolledIds } }).lean()
  return {
    subjects: subjects.map((subject) => ({
      id: String(subject._id),
      code: subject.code,
      name: subject.name,
      classroom: subject.classroom,
      schedule: subject.schedule,
    })),
    enrollments: enrollments.map((item) => ({
      subjectId: String(item.subject),
      status: item.status,
      inscribedToExam: item.inscribedToExam,
    })),
    grades: grades.map((grade) => ({
      subjectId: String(grade.subject),
      instance: grade.instance,
      score: grade.score,
    })),
    exams: exams.map((exam) => ({
      subjectId: String(exam.subject),
      type: exam.type,
      date: exam.date,
      inscriptionDeadline: exam.inscriptionDeadline,
      classroom: exam.classroom,
    })),
    notices: notices.map((notice) => ({
      title: notice.title,
      body: notice.body,
      createdAt: notice.createdAt,
    })),
  }
}
