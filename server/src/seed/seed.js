import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import { connectDB } from '../config/db.js'
import { User } from '../models/User.js'
import { Career } from '../models/Career.js'
import { Subject } from '../models/Subject.js'
import { Enrollment } from '../models/Enrollment.js'
import { Grade } from '../models/Grade.js'
import { Exam } from '../models/Exam.js'
import { Notice } from '../models/Notice.js'
import { Preference } from '../models/Preference.js'
import { MailLog } from '../models/MailLog.js'
import { Conversation } from '../models/Conversation.js'
import { Message } from '../models/Message.js'

dotenv.config()

const daysFromNow = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000)

const students = [
  { name: 'Martin Ferreyra', document: '41344636', documentType: 'dni', email: 'martinferreyrae@gmail.com', legajo: 'UIA70035', emailEnabled: true, tomiEnabled: true },
  { name: 'Luis Gómez', document: '38999888', documentType: 'dni', email: 'luis.gomez@gmail.com', legajo: 'UIA71842', emailEnabled: false, tomiEnabled: true },
  { name: 'María López', document: '41222333', documentType: 'dni', email: 'maria.lopez@gmail.com', legajo: 'UIA77701', emailEnabled: true, tomiEnabled: false },
  { name: 'Juan Díaz', document: '42555666', documentType: 'dni', email: 'juan.diaz@gmail.com', legajo: 'UIA74520', emailEnabled: true, tomiEnabled: true },
  { name: 'Sofía Ruiz', document: '37888999', documentType: 'dni', email: 'sofia.ruiz@gmail.com', legajo: 'UIA70916', emailEnabled: true, tomiEnabled: true },
  { name: 'Mateo Castro', document: '40123456', documentType: 'dni', email: 'mateo.castro@gmail.com', legajo: 'UIA76638', emailEnabled: false, tomiEnabled: false },
  { name: 'Valentina Ortiz', document: '43000111', documentType: 'dni', email: 'valentina.ortiz@gmail.com', legajo: 'UIA72204', emailEnabled: true, tomiEnabled: true },
  { name: 'Nicolás Fernández', document: '39555111', documentType: 'dni', email: 'nicolas.fernandez@gmail.com', legajo: 'UIA78157', emailEnabled: true, tomiEnabled: true },
  { name: 'Camila Torres', document: '42000222', documentType: 'dni', email: 'camila.torres@gmail.com', legajo: 'UIA73390', emailEnabled: true, tomiEnabled: true },
  { name: 'Facundo Molina', document: '41000333', documentType: 'dni', email: 'facundo.molina@gmail.com', legajo: 'UIA75741', emailEnabled: true, tomiEnabled: true },
  { name: 'Lucía Romero', document: 'AAB123456', documentType: 'pasaporte', email: 'lucia.romero@gmail.com', legajo: 'UIA71088', emailEnabled: false, tomiEnabled: true },
  { name: 'Bruno Acosta', document: '44000444', documentType: 'dni', email: 'bruno.acosta@gmail.com', legajo: 'UIA79462', emailEnabled: true, tomiEnabled: true },
]

const subjects = [
  { year: 1, order: 1, code: 'AYPA', name: 'Algoritmos y Paradigmas', classroom: '1', schedule: 'lunes y miércoles de 08:00 a 10:00' },
  { year: 1, order: 2, code: 'ALG1', name: 'Álgebra I', classroom: '2', schedule: 'martes y jueves de 08:00 a 10:00' },
  { year: 1, order: 3, code: 'INGA1', name: 'Inglés A1', classroom: '3', schedule: 'viernes de 08:00 a 10:00' },
  { year: 1, order: 4, code: 'FH1', name: 'Formación Humanística I', classroom: '4', schedule: 'lunes de 10:00 a 12:00' },
  { year: 1, order: 5, code: 'DESW', name: 'Desarrollo de Software', classroom: '12', schedule: 'lunes y miércoles de 18:00 a 20:00' },
  { year: 1, order: 6, code: 'RRHH', name: 'Gestión de RRHH', classroom: '6', schedule: 'martes de 10:00 a 12:00' },
  { year: 1, order: 7, code: 'BD', name: 'Bases de Datos', classroom: '5', schedule: 'martes y jueves de 16:00 a 18:00' },
  { year: 1, order: 8, code: 'ALG2', name: 'Álgebra II', classroom: '2', schedule: 'miércoles y viernes de 10:00 a 12:00' },
  { year: 1, order: 9, code: 'SEM1', name: 'Seminario Informático I', classroom: '7', schedule: 'jueves de 18:00 a 20:00' },
  { year: 2, order: 1, code: 'INGA2', name: 'Inglés A2', classroom: '3', schedule: 'viernes de 10:00 a 12:00' },
  { year: 2, order: 2, code: 'FH2', name: 'Formación Humanística II', classroom: '4', schedule: 'lunes de 14:00 a 16:00' },
  { year: 2, order: 3, code: 'FCC', name: 'Fund. del Control de Calidad', classroom: '8', schedule: 'viernes de 14:00 a 18:00' },
  { year: 2, order: 4, code: 'SEM2', name: 'Seminario Informático II', classroom: '7', schedule: 'martes de 18:00 a 20:00' },
  { year: 2, order: 5, code: 'FRONT', name: 'Desarrollo Front End', classroom: '9', schedule: 'lunes y miércoles de 16:00 a 18:00' },
  { year: 2, order: 6, code: 'CCA', name: 'Control de Calidad Avanzado', classroom: '8', schedule: 'jueves de 14:00 a 18:00' },
  { year: 2, order: 7, code: 'SEM3', name: 'Seminario Informático III', classroom: '7', schedule: 'viernes de 18:00 a 20:00' },
  { year: 2, order: 8, code: 'BACK', name: 'Desarrollo Back End', classroom: '11', schedule: 'martes y jueves de 18:00 a 20:00' },
  { year: 3, order: 1, code: 'DAW', name: 'Desarrollo de Aplic. Web', classroom: '3', schedule: 'lunes y miércoles de 14:00 a 16:00' },
  { year: 3, order: 2, code: 'TEST', name: 'Testeo Automatizado', classroom: '10', schedule: 'martes de 14:00 a 18:00' },
  { year: 3, order: 3, code: 'INGB1', name: 'Inglés B1.1', classroom: '3', schedule: 'viernes de 16:00 a 18:00' },
  { year: 3, order: 4, code: 'PF', name: 'Proyecto Final', classroom: '1', schedule: 'jueves de 18:00 a 22:00' },
]

const codesByYear = (year) => subjects.filter((subject) => subject.year === year).map((subject) => subject.code)

const rows = (email, codes, status, inscribedToExam) =>
  codes.map((code) => [email, code, status, inscribedToExam])

const juan = 'juan.diaz@gmail.com'
const valentina = 'valentina.ortiz@gmail.com'
const facundo = 'facundo.molina@gmail.com'
const maria = 'maria.lopez@gmail.com'

const enrollmentPlan = [
  // Juan cursa el primer año completo.
  ...rows(juan, codesByYear(1), 'cursando', false),

  // Valentina ya regularizó primero y cursa todo segundo.
  ...rows(valentina, codesByYear(1), 'regular', true),
  ...rows(valentina, codesByYear(2), 'cursando', false),

  // Facundo regularizó primero y segundo, y cursa todo tercero. Adeuda las mesas de segundo.
  ...rows(facundo, codesByYear(1), 'regular', true),
  ...rows(facundo, codesByYear(2), 'regular', false),
  ...rows(facundo, codesByYear(3), 'cursando', false),

  // María está en tercero y todavía arrastra materias de segundo.
  ...rows(maria, codesByYear(1), 'regular', true),
  [maria, 'DAW', 'regular', true],
  [maria, 'TEST', 'cursando', false],
  [maria, 'INGB1', 'cursando', false],
  [maria, 'PF', 'cursando', false],
  [maria, 'INGA2', 'cursando', false],
  [maria, 'SEM2', 'cursando', false],
  [maria, 'CCA', 'cursando', false],
  [maria, 'SEM3', 'cursando', false],
  [maria, 'FH2', 'regular', true],
  [maria, 'FRONT', 'regular', true],
  [maria, 'FCC', 'regular', false],
  [maria, 'BACK', 'regular', false],

  // El resto cursa un tramo de la carrera, sin el año completo.
  ['martinferreyrae@gmail.com', 'DESW', 'cursando', false],
  ['martinferreyrae@gmail.com', 'FCC', 'regular', false],
  ['luis.gomez@gmail.com', 'BD', 'cursando', false],
  ['luis.gomez@gmail.com', 'FCC', 'regular', false],
  ['sofia.ruiz@gmail.com', 'DESW', 'cursando', false],
  ['sofia.ruiz@gmail.com', 'INGA1', 'cursando', false],
  ['mateo.castro@gmail.com', 'BD', 'cursando', false],
  ['mateo.castro@gmail.com', 'RRHH', 'cursando', false],
  ['nicolas.fernandez@gmail.com', 'BACK', 'cursando', false],
  ['nicolas.fernandez@gmail.com', 'SEM2', 'cursando', false],
  ['camila.torres@gmail.com', 'FRONT', 'cursando', false],
  ['camila.torres@gmail.com', 'CCA', 'regular', false],
  ['lucia.romero@gmail.com', 'FCC', 'regular', false],
  ['bruno.acosta@gmail.com', 'AYPA', 'cursando', false],
  ['bruno.acosta@gmail.com', 'ALG2', 'cursando', false],
]

export async function seedDatabase() {
  if (process.env.NODE_ENV === 'production' && process.env.SEED_FORCE !== 'true') {
    throw new Error('El seed no corre en producción sin SEED_FORCE=true')
  }

  await Promise.all([
    User.deleteMany({}),
    Career.deleteMany({}),
    Subject.deleteMany({}),
    Enrollment.deleteMany({}),
    Grade.deleteMany({}),
    Exam.deleteMany({}),
    Notice.deleteMany({}),
    Preference.deleteMany({}),
    MailLog.deleteMany({}),
    Conversation.deleteMany({}),
    Message.deleteMany({}),
  ])

  const passwordAdmin = await bcrypt.hash('Admin123!', 8)
  const passwordStudent = await bcrypt.hash('Alumno123!', 8)

  const admin = await User.create({
    name: 'Secretaría Académica',
    document: 'admin',
    email: 'admin@unsta.edu.ar',
    password: passwordAdmin,
    role: 'admin',
  })

  const studentDocs = {}
  for (const student of students) {
    const doc = await User.create({
      name: student.name,
      document: student.document,
      documentType: student.documentType,
      email: student.email,
      password: passwordStudent,
      role: 'alumno',
      legajo: student.legajo,
    })
    studentDocs[student.email] = doc
    await Preference.create({
      student: doc._id,
      emailEnabled: student.emailEnabled,
      tomiEnabled: student.tomiEnabled,
    })
  }

  const career = await Career.create({
    name: 'Tecnicatura en Desarrollo y Calidad de Software',
    code: 'TDCS',
  })

  const subjectDocs = {}
  for (const subject of subjects) {
    subjectDocs[subject.code] = await Subject.create({ ...subject, career: career._id })
  }

  for (const [email, code, status, inscribedToExam] of enrollmentPlan) {
    await Enrollment.create({
      student: studentDocs[email]._id,
      subject: subjectDocs[code]._id,
      status,
      inscribedToExam,
    })
  }

  await Grade.create([
    { student: studentDocs['martinferreyrae@gmail.com']._id, subject: subjectDocs.DESW._id, instance: 'parcial', score: 8 },
    { student: studentDocs['luis.gomez@gmail.com']._id, subject: subjectDocs.BD._id, instance: 'parcial', score: 5 },
    { student: studentDocs[maria]._id, subject: subjectDocs.DAW._id, instance: 'parcial', score: 9 },
    { student: studentDocs[maria]._id, subject: subjectDocs.FRONT._id, instance: 'parcial', score: 8 },
    { student: studentDocs[valentina]._id, subject: subjectDocs.ALG1._id, instance: 'parcial', score: 7 },
    { student: studentDocs[valentina]._id, subject: subjectDocs.DESW._id, instance: 'final', score: 8 },
    { student: studentDocs[facundo]._id, subject: subjectDocs.AYPA._id, instance: 'final', score: 9 },
    { student: studentDocs[facundo]._id, subject: subjectDocs.BACK._id, instance: 'parcial', score: 6 },
  ])

  await Exam.create([
    { subject: subjectDocs.DESW._id, type: 'parcial', date: daysFromNow(14), classroom: '12' },
    {
      subject: subjectDocs.FCC._id,
      type: 'final',
      date: daysFromNow(12),
      inscriptionDeadline: daysFromNow(5),
      classroom: '8',
    },
    { subject: subjectDocs.BD._id, type: 'parcial', date: daysFromNow(10), classroom: '5' },
    {
      subject: subjectDocs.DAW._id,
      type: 'final',
      date: daysFromNow(25),
      inscriptionDeadline: daysFromNow(18),
      classroom: '3',
    },
    {
      subject: subjectDocs.BACK._id,
      type: 'final',
      date: daysFromNow(40),
      inscriptionDeadline: daysFromNow(30),
      classroom: '11',
    },
  ])

  const calEnrollments = await Enrollment.find({ subject: subjectDocs.FCC._id })
  const notice = await Notice.create({
    title: 'Cambio de aula de Fund. del Control de Calidad',
    body: 'La cursada del viernes pasa al aula 8. Lleguen diez minutos antes.',
    type: 'aula',
    subject: subjectDocs.FCC._id,
    recipients: calEnrollments.map((item) => item.student),
    author: admin._id,
  })

  for (const enrollment of calEnrollments) {
    const student = students.find((item) => String(studentDocs[item.email]._id) === String(enrollment.student))
    await MailLog.create({
      notice: notice._id,
      student: enrollment.student,
      status: student?.emailEnabled ? 'simulado' : 'omitido',
      detail: student?.emailEnabled
        ? 'Aviso inicial de demostración, registrado sin salir por SMTP.'
        : 'El alumno desactivó las notificaciones por email.',
      body: `${notice.title}. ${notice.body}`,
    })
  }
}

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  connectDB()
    .then(() => seedDatabase())
    .then(() => {
      console.log('Datos de demostración cargados.')
      console.log('Admin: admin / Admin123!')
      console.log('Alumno: 41344636 / Alumno123!')
      console.log('Alumno sin mail: 38999888 / Alumno123!')
      console.log('Pasaporte: AAB123456 / Alumno123!')
    })
    .catch((error) => {
      console.error(error)
      process.exitCode = 1
    })
    .finally(async () => {
      await mongoose.disconnect()
    })
}
