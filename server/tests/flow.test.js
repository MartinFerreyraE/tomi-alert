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
  const anaToken = await login('40111222', 'Alumno123!')
  const note = await request(app)
    .post('/api/chat')
    .set('Authorization', `Bearer ${anaToken}`)
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
      type: 'final',
      subjectId: calidad._id,
    })
  assert.equal(created.status, 201)

  const logs = await request(app).get('/api/mail-logs').set('Authorization', `Bearer ${adminToken}`)
  const luis = logs.body.find((log) => log.student?.email === 'luis.gomez@unsta.edu.ar' && log.notice?.title === 'Mesa de final')
  const anaLog = logs.body.find((log) => log.student?.email === 'ana.perez@unsta.edu.ar' && log.notice?.title === 'Mesa de final')
  assert.equal(luis.status, 'omitido')
  assert.equal(anaLog.status, 'simulado')

  const chat = await request(app).get('/api/chat').set('Authorization', `Bearer ${anaToken}`)
  assert.ok(chat.body.messages.some((message) => message.proactive && message.text.includes('Mesa de final')))

  const run = await request(app).post('/api/reminders/run').set('Authorization', `Bearer ${adminToken}`)
  assert.equal(run.status, 200)
  assert.ok(run.body.created >= 1)

  const after = await request(app).get('/api/chat').set('Authorization', `Bearer ${anaToken}`)
  assert.ok(after.body.messages.some((message) => message.meta?.kind === 'exam-reminder'))

  const mariaToken = await login('41222333', 'Alumno123!')
  const mariaChat = await request(app).get('/api/chat').set('Authorization', `Bearer ${mariaToken}`)
  assert.equal(mariaChat.body.messages.filter((message) => message.meta?.kind === 'exam-reminder').length, 0)
})
