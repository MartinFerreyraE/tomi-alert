import { Subject } from '../models/Subject.js'
import { Career } from '../models/Career.js'
import { Enrollment } from '../models/Enrollment.js'
import { Grade } from '../models/Grade.js'
import { Exam } from '../models/Exam.js'
import { User } from '../models/User.js'
import { Notice } from '../models/Notice.js'
import { MailLog } from '../models/MailLog.js'
import { asyncHandler, httpError } from '../http.js'
import { notifyExamChange, notifyGrade } from '../services/notifyService.js'

function isAdmin(user) {
  return user.role === 'admin'
}

export const listCareers = asyncHandler(async (_req, res) => {
  const careers = await Career.find().sort({ name: 1 })
  res.json(careers)
})

export const listSubjects = asyncHandler(async (req, res) => {
  if (isAdmin(req.user)) {
    const filter = {}
    if (req.query.career) filter.career = req.query.career
    if (req.query.year) filter.year = Number(req.query.year)
    const subjects = await Subject.find(filter).populate('career', 'name code').sort({ year: 1, order: 1 })
    return res.json(subjects)
  }
  const enrollments = await Enrollment.find({ student: req.user._id }).populate({
    path: 'subject',
    populate: { path: 'career', select: 'name code' },
  })
  const rows = enrollments.filter((item) => item.subject).map((item) => ({
    ...item.subject.toObject(),
    enrollmentStatus: item.status,
    inscribedToExam: item.inscribedToExam,
  }))
  rows.sort((a, b) => a.year - b.year || a.order - b.order)
  res.json(rows)
})

export const updateSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id)
  if (!subject) throw httpError(404, 'Materia no encontrada.')
  if (req.body.classroom != null) subject.classroom = String(req.body.classroom).trim()
  if (req.body.schedule != null) subject.schedule = String(req.body.schedule).trim()
  await subject.save()
  res.json(await subject.populate('career', 'name code'))
})

export const listEnrollments = asyncHandler(async (req, res) => {
  const filter = {}
  if (req.query.subject) filter.subject = req.query.subject
  if (!isAdmin(req.user)) filter.student = req.user._id
  const enrollments = await Enrollment.find(filter).populate('student', 'name email legajo').populate('subject', 'code name')
  res.json(enrollments)
})

export const createEnrollment = asyncHandler(async (req, res) => {
  const { studentId, subjectId, status } = req.body
  if (!studentId || !subjectId) throw httpError(400, 'Alumno y materia son obligatorios.')
  if (!['cursando', 'regular'].includes(status)) throw httpError(400, 'El estado debe ser cursando o regular.')
  const exists = await Enrollment.findOne({ student: studentId, subject: subjectId })
  if (exists) throw httpError(409, 'Ese alumno ya está inscripto en la materia.')
  const enrollment = await Enrollment.create({
    student: studentId,
    subject: subjectId,
    status,
    inscribedToExam: Boolean(req.body.inscribedToExam),
  })
  const populated = await enrollment.populate('student', 'name email legajo')
  res.status(201).json(populated)
})

export const updateEnrollment = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findById(req.params.id)
  if (!enrollment) throw httpError(404, 'Inscripción no encontrada.')
  if (req.body.status != null) {
    if (!['cursando', 'regular'].includes(req.body.status)) throw httpError(400, 'Estado inválido.')
    enrollment.status = req.body.status
  }
  if (req.body.inscribedToExam != null) enrollment.inscribedToExam = Boolean(req.body.inscribedToExam)
  await enrollment.save()
  res.json(enrollment)
})

export const listStudents = asyncHandler(async (_req, res) => {
  const students = await User.find({ role: 'alumno' }).select('name email legajo').sort({ name: 1 })
  res.json(students)
})

export const listExams = asyncHandler(async (req, res) => {
  const filter = {}
  if (!isAdmin(req.user)) {
    const enrollments = await Enrollment.find({ student: req.user._id }).select('subject')
    filter.subject = { $in: enrollments.map((item) => item.subject) }
  }
  const exams = await Exam.find(filter).populate('subject', 'code name classroom').sort({ date: 1 })
  res.json(exams)
})

export const createExam = asyncHandler(async (req, res) => {
  const { subjectId, type, date, inscriptionDeadline, classroom } = req.body
  if (!subjectId || !type || !date) throw httpError(400, 'Materia, tipo y fecha son obligatorios.')
  if (!['parcial', 'final'].includes(type)) throw httpError(400, 'El tipo debe ser parcial o final.')
  if (type === 'final' && !inscriptionDeadline) throw httpError(400, 'La mesa de final necesita fecha límite de inscripción.')
  if (inscriptionDeadline && new Date(inscriptionDeadline) > new Date(date)) {
    throw httpError(400, 'El límite de inscripción no puede ser posterior a la mesa.')
  }
  const exam = await Exam.create({
    subject: subjectId,
    type,
    date: new Date(date),
    inscriptionDeadline: inscriptionDeadline ? new Date(inscriptionDeadline) : undefined,
    classroom: String(classroom || '').trim(),
  })
  await notifyExamChange({
    subjectId,
    action: 'creado',
    type: exam.type,
    date: exam.date,
    inscriptionDeadline: exam.inscriptionDeadline,
    classroom: exam.classroom,
  })
  const populated = await exam.populate('subject', 'code name classroom')
  res.status(201).json(populated)
})

export const updateExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id)
  if (!exam) throw httpError(404, 'Mesa no encontrada.')
  const previous = {
    subject: exam.subject,
    type: exam.type,
    date: exam.date,
    inscriptionDeadline: exam.inscriptionDeadline,
    classroom: exam.classroom,
  }
  if (req.body.type) exam.type = req.body.type
  if (req.body.date) exam.date = new Date(req.body.date)
  if (req.body.inscriptionDeadline) exam.inscriptionDeadline = new Date(req.body.inscriptionDeadline)
  if (req.body.classroom != null) exam.classroom = String(req.body.classroom).trim()
  if (req.body.subjectId) exam.subject = req.body.subjectId
  await exam.save()
  if (String(previous.subject) !== String(exam.subject)) {
    await notifyExamChange({
      subjectId: previous.subject,
      action: 'borrado',
      type: previous.type,
      date: previous.date,
      inscriptionDeadline: previous.inscriptionDeadline,
      classroom: previous.classroom,
    })
    await notifyExamChange({
      subjectId: exam.subject,
      action: 'creado',
      type: exam.type,
      date: exam.date,
      inscriptionDeadline: exam.inscriptionDeadline,
      classroom: exam.classroom,
    })
  } else {
    await notifyExamChange({
      subjectId: exam.subject,
      action: 'editado',
      type: exam.type,
      date: exam.date,
      inscriptionDeadline: exam.inscriptionDeadline,
      classroom: exam.classroom,
    })
  }
  res.json(await exam.populate('subject', 'code name classroom'))
})

export const deleteExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id)
  if (!exam) throw httpError(404, 'Mesa no encontrada.')
  await exam.deleteOne()
  await notifyExamChange({
    subjectId: exam.subject,
    action: 'borrado',
    type: exam.type,
    date: exam.date,
    inscriptionDeadline: exam.inscriptionDeadline,
    classroom: exam.classroom,
  })
  res.json({ ok: true })
})

export const listGrades = asyncHandler(async (req, res) => {
  const filter = {}
  if (!isAdmin(req.user)) filter.student = req.user._id
  if (req.query.subject) filter.subject = req.query.subject
  const grades = await Grade.find(filter)
    .populate('student', 'name email legajo')
    .populate('subject', 'code name')
    .sort({ loadedAt: -1 })
  res.json(grades)
})

export const createGrade = asyncHandler(async (req, res) => {
  const { studentId, subjectId, instance, score } = req.body
  if (!studentId || !subjectId || !instance || score == null) {
    throw httpError(400, 'Alumno, materia, instancia y nota son obligatorios.')
  }
  if (!['parcial', 'recuperatorio', 'final'].includes(instance)) throw httpError(400, 'Instancia inválida.')
  const numeric = Number(score)
  if (Number.isNaN(numeric) || numeric < 0 || numeric > 10) throw httpError(400, 'La nota tiene que estar entre 0 y 10.')
  const enrollment = await Enrollment.findOne({ student: studentId, subject: subjectId })
  if (!enrollment) throw httpError(400, 'El alumno no está inscripto en esa materia.')
  if (enrollment.status !== 'regular') throw httpError(400, 'Solo se puede cargar una nota a un alumno regular de esa materia.')
  const grade = await Grade.create({
    student: studentId,
    subject: subjectId,
    instance,
    score: numeric,
    loadedAt: new Date(),
  })
  const subject = await Subject.findById(subjectId)
  await notifyGrade({ studentId, subjectName: subject?.name || 'la materia', instance, score: numeric })
  const populated = await grade.populate('student', 'name email legajo')
  await populated.populate('subject', 'code name')
  res.status(201).json(populated)
})

export const stats = asyncHandler(async (_req, res) => {
  const [students, subjects, notices, mailsSent, mailsSkipped] = await Promise.all([
    User.countDocuments({ role: 'alumno' }),
    Subject.countDocuments(),
    Notice.countDocuments(),
    MailLog.countDocuments({ status: { $in: ['enviado', 'simulado'] } }),
    MailLog.countDocuments({ status: 'omitido' }),
  ])
  res.json({ students, subjects, notices, mailsSent, mailsSkipped })
})
