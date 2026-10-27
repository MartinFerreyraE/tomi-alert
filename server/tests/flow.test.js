import test from 'node:test'
import assert from 'node:assert/strict'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { connectDB } from '../src/config/db.js'
import { seedDatabase } from '../src/seed/seed.js'

dotenv.config()
process.env.JWT_SECRET = 'test-secret'
process.env.SKIP_SMTP = 'true'
process.env.NODE_ENV = 'test'

const uri = 'mongodb://127.0.0.1:27017/tomi-alert-test'
let app

test.before(async () => {
  await connectDB(uri)
  await seedDatabase()
  app = createApp()
})

test.after(async () => {
  await mongoose.connection.dropDatabase()
  await mongoose.disconnect()
})

async function login(document, password) {
  const response = await request(app).post('/api/auth/login').send({ document, password })
  assert.equal(response.status, 200)
  return response.body.token
}

test('recorrido de defensa: nota, aviso y recordatorio de mesa', async () => {
  const martinToken = await login('41344636', 'Alumno123!')
  const note = await request(app)
    .post('/api/chat')
    .set('Authorization', `Bearer ${martinToken}`)
    .send({ text: 'qué nota tengo en desarrollo de software' })
  assert.equal(note.status, 200)
  assert.match(note.body.reply.text, /parcial: 8/)

  const adminToken = await login('admin', 'Admin123!')
  const subjects = await request(app).get('/api/subjects').set('Authorization', `Bearer ${adminToken}`)
  const calidad = subjects.body.find((subject) => subject.code === 'FCC')
  const created = await request(app)
    .post('/api/notices')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      title: 'Mesa de final',
      body: 'Recuerden inscribirse antes del límite.',
      type: 'aula',
      subjectId: calidad._id,
    })
  assert.equal(created.status, 201)

  const logs = await request(app).get('/api/mail-logs').set('Authorization', `Bearer ${adminToken}`)
  const luis = logs.body.items.find((log) => log.student?.email === 'luis.gomez@gmail.com' && log.notice?.title === 'Mesa de final')
  const martinLog = logs.body.items.find((log) => log.student?.email === 'martinferreyrae@gmail.com' && log.notice?.title === 'Mesa de final')
  const omitted = await request(app).get('/api/mail-logs?status=omitido').set('Authorization', `Bearer ${adminToken}`)
  assert.ok(omitted.body.total >= 1)
  assert.ok(omitted.body.items.every((log) => log.status === 'omitido'))
  assert.equal(luis.status, 'omitido')
  assert.equal(martinLog.status, 'simulado')

  const chat = await request(app).get('/api/chat').set('Authorization', `Bearer ${martinToken}`)
  assert.ok(chat.body.messages.some((message) => message.proactive && message.text.includes('Mesa de final')))

  const run = await request(app).post('/api/reminders/run').set('Authorization', `Bearer ${adminToken}`)
  assert.equal(run.status, 200)
  assert.ok(run.body.created >= 1)

  const after = await request(app).get('/api/chat').set('Authorization', `Bearer ${martinToken}`)
  assert.ok(after.body.messages.some((message) => message.meta?.kind === 'exam-reminder'))

  const students = await request(app).get('/api/students').set('Authorization', `Bearer ${adminToken}`)
  const martin = students.body.find((student) => student.email === 'martinferreyrae@gmail.com')
  const grade = await request(app)
    .post('/api/grades')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ studentId: martin._id, subjectId: calidad._id, instance: 'final', score: 9 })
  assert.equal(grade.status, 201)

  const gradeLogs = await request(app).get('/api/mail-logs').set('Authorization', `Bearer ${adminToken}`)
  const gradeLog = gradeLogs.body.items.find((log) => log.title === 'Nota de final en Fund. del Control de Calidad')
  assert.equal(gradeLog.status, 'simulado')
  assert.equal(gradeLog.student.email, 'martinferreyrae@gmail.com')

  const gradeChat = await request(app).get('/api/chat').set('Authorization', `Bearer ${martinToken}`)
  assert.ok(gradeChat.body.messages.some((message) => message.meta?.kind === 'grade' && message.text.includes('nota de final')))

  const exams = await request(app).get('/api/exams').set('Authorization', `Bearer ${adminToken}`)
  const fccExam = exams.body.find((exam) => exam.subject?.code === 'FCC' && exam.type === 'final')
  const edited = await request(app)
    .put(`/api/exams/${fccExam._id}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ classroom: '9', date: fccExam.date, inscriptionDeadline: fccExam.inscriptionDeadline })
  assert.equal(edited.status, 200)

  const examLogs = await request(app).get('/api/mail-logs').set('Authorization', `Bearer ${adminToken}`)
  const martinExam = examLogs.body.items.find((log) => log.title === 'Cambios en el final de Fund. del Control de Calidad' && log.student?.email === 'martinferreyrae@gmail.com')
  const luisExam = examLogs.body.items.find((log) => log.title === 'Cambios en el final de Fund. del Control de Calidad' && log.student?.email === 'luis.gomez@gmail.com')
  assert.equal(martinExam.status, 'simulado')
  assert.match(martinExam.body, /El aula es 9/)
  assert.equal(luisExam.status, 'omitido')

  const examChat = await request(app).get('/api/chat').set('Authorization', `Bearer ${martinToken}`)
  assert.ok(examChat.body.messages.some((message) => message.meta?.kind === 'exam-change' && message.text.includes('Se modificó el final')))

  const mariaToken = await login('41222333', 'Alumno123!')
  const mariaChat = await request(app).get('/api/chat').set('Authorization', `Bearer ${mariaToken}`)
  assert.equal(mariaChat.body.messages.filter((message) => message.meta?.kind === 'exam-reminder').length, 0)
})
