import test from 'node:test'
import assert from 'node:assert/strict'
import {
  normalize,
  detectIntent,
  handleTurn,
  buildExamReminder,
  buildGradeMessage,
  buildExamChangeMessage,
} from '../src/chat/engine.js'

const subjects = [
  { id: 'prog', code: 'PROG2', name: 'Programación II', classroom: '12', schedule: 'lunes y miércoles de 18:00 a 20:00' },
  { id: 'cal', code: 'CAL', name: 'Calidad de Software', classroom: '8', schedule: 'viernes de 14:00 a 18:00' },
  { id: 'web', code: 'WEB', name: 'Desarrollo Web', classroom: '3', schedule: 'lunes de 14:00 a 16:00' },
]

const baseContext = {
  enrollments: [
    { subjectId: 'prog', status: 'cursando', inscribedToExam: false },
    { subjectId: 'cal', status: 'regular', inscribedToExam: false },
  ],
  grades: [{ subjectId: 'prog', instance: 'parcial', score: 8 }],
  exams: [
    { subjectId: 'prog', type: 'parcial', date: '2026-10-15T15:00:00.000Z', classroom: '12' },
    { subjectId: 'cal', type: 'final', date: '2026-11-02T15:00:00.000Z', inscriptionDeadline: '2026-10-26T15:00:00.000Z', classroom: '8' },
  ],
  notices: [{ title: 'Cambio de aula' }],
}

test('normaliza acentos y espacios', () => {
  assert.equal(normalize('  ¿Cuándo es el Parcial? '), 'cuando es el parcial')
})

test('prioriza la consulta sobre el saludo', () => {
  assert.equal(detectIntent('hola, qué nota tengo'), 'notas')
})

test('prioriza inscripción cuando también dice final', () => {
  assert.equal(detectIntent('me quiero inscribir al final'), 'inscripcion')
})

test('pide la materia si hay más de una', () => {
  const result = handleTurn({ text: '¿cuándo es el parcial?', subjects, context: baseContext })
  assert.equal(result.pendingIntent, 'parciales')
  assert.match(result.reply, /De qué materia/)
})

test('en el turno siguiente usa la materia pendiente', () => {
  const result = handleTurn({
    text: 'Programación II',
    pendingIntent: 'parciales',
    subjects,
    context: baseContext,
  })
  assert.equal(result.pendingIntent, null)
  assert.match(result.reply, /Programación II/)
  assert.match(result.reply, /15\/10\/2026/)
})

test('devuelve la nota cargada', () => {
  const result = handleTurn({ text: 'qué nota tengo en programación', subjects, context: baseContext })
  assert.match(result.reply, /parcial: 8/)
})

test('avisa cuando no hay nota', () => {
  const result = handleTurn({ text: 'notas de calidad de software', subjects, context: baseContext })
  assert.equal(result.reply, 'No tenés nota cargada en Calidad de Software.')
})

test('asume la única materia inscripta', () => {
  const context = {
    ...baseContext,
    enrollments: [{ subjectId: 'web', status: 'cursando', inscribedToExam: false }],
    grades: [],
    exams: [],
  }
  const only = [subjects[2]]
  const result = handleTurn({ text: 'horario', subjects: only, context })
  assert.match(result.reply, /Desarrollo Web/)
  assert.equal(result.pendingIntent, null)
})

test('rechaza una materia en la que no está inscripto', () => {
  const result = handleTurn({ text: 'aula de desarrollo web', subjects, context: baseContext })
  assert.equal(result.reply, 'No estás inscripto en Desarrollo Web.')
})

test('informa la inscripción a la mesa', () => {
  const result = handleTurn({ text: 'me puedo inscribir en calidad de software', subjects, context: baseContext })
  assert.match(result.reply, /regularizada/)
  assert.match(result.reply, /todavía no figurás inscripto/)
})

test('el fallback ofrece las opciones', () => {
  const result = handleTurn({ text: 'asdfgh', subjects, context: baseContext })
  assert.match(result.reply, /No estoy seguro/)
  assert.ok(result.quickReplies.includes('Parciales'))
})

test('los recordatorios mencionan la fecha límite', () => {
  const text = buildExamReminder({ subjectName: 'Calidad de Software', deadline: '2026-10-26T15:00:00.000Z' })
  assert.match(text, /Calidad de Software/)
  assert.match(text, /26\/10\/2026/)
})

test('pregunta cuando el nombre coincide con más de una materia', () => {
  const algebras = [
    { id: 'a1', code: 'ALG1', name: 'Álgebra I', classroom: '2', schedule: 'martes' },
    { id: 'a2', code: 'ALG2', name: 'Álgebra II', classroom: '2', schedule: 'miércoles' },
  ]
  const context = {
    enrollments: [
      { subjectId: 'a1', status: 'cursando', inscribedToExam: false },
      { subjectId: 'a2', status: 'cursando', inscribedToExam: false },
    ],
    grades: [{ subjectId: 'a2', instance: 'parcial', score: 7 }],
    exams: [],
    notices: [],
  }
  const ambiguous = handleTurn({ text: 'qué nota tengo en álgebra', subjects: algebras, context })
  assert.equal(ambiguous.pendingIntent, 'notas')
  assert.match(ambiguous.reply, /Álgebra I/)
  assert.match(ambiguous.reply, /Álgebra II/)
  const exact = handleTurn({ text: 'álgebra ii', pendingIntent: 'notas', subjects: algebras, context })
  assert.equal(exact.pendingIntent, null)
  assert.match(exact.reply, /parcial: 7/)
})

test('el aviso de mesa incluye la información nueva', () => {
  const message = buildExamChangeMessage({
    action: 'editado',
    subjectName: 'Fund. del Control de Calidad',
    type: 'final',
    date: '2026-11-18T15:00:00.000Z',
    inscriptionDeadline: '2026-11-12T15:00:00.000Z',
    classroom: '9',
  })
  assert.equal(
    message,
    'Se modificó el final de Fund. del Control de Calidad. La fecha es el 18/11/2026. El aula es 9. El límite de inscripción es el 12/11/2026.'
  )
})

test('el aviso de nota incluye instancia y valor', () => {
  assert.equal(
    buildGradeMessage({ subjectName: 'Programación II', instance: 'parcial', score: 8 }),
    'Se cargó una nota de parcial en Programación II: 8.'
  )
})
