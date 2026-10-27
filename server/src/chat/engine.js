const INTENTS = [
  { id: 'inscripcion', priority: 8, keywords: ['inscripcion', 'inscribirme', 'inscribir', 'anotarme', 'fecha limite'] },
  { id: 'parciales', priority: 6, keywords: ['parcial', 'parciales'] },
  { id: 'finales', priority: 6, keywords: ['final', 'finales', 'mesa', 'mesas'] },
  { id: 'notas', priority: 6, keywords: ['nota', 'notas', 'calificacion', 'calificaciones'] },
  { id: 'horarios', priority: 5, keywords: ['horario', 'horarios', 'cursada'] },
  { id: 'aulas', priority: 5, keywords: ['aula', 'aulas', 'donde curso', 'donde es'] },
  { id: 'avisos', priority: 5, keywords: ['aviso', 'avisos', 'novedad', 'novedades', 'notificacion', 'notificaciones'] },
  { id: 'ayuda', priority: 2, keywords: ['ayuda', 'que podes', 'que puedes', 'opciones'] },
  { id: 'saludo', priority: 1, keywords: ['hola', 'buenas', 'buen dia', 'hey'] },
]

const NEEDS_SUBJECT = new Set(['parciales', 'finales', 'inscripcion', 'notas', 'horarios', 'aulas'])

export const QUICK_REPLIES = ['Parciales', 'Finales', 'Notas', 'Horarios', 'Aulas', 'Inscripción']

export function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function keywordHits(text, keyword) {
  if (keyword.includes(' ')) return text.includes(keyword) ? keyword.length : 0
  const tokens = text.split(' ').filter(Boolean)
  const matched = tokens.some((token) => token === keyword || (keyword.length >= 5 && token.startsWith(keyword)))
  return matched ? keyword.length : 0
}

export function detectIntent(raw) {
  const text = normalize(raw)
  if (!text) return null
  let best = null
  for (const intent of INTENTS) {
    const score = intent.keywords.reduce((sum, keyword) => sum + keywordHits(text, keyword), 0)
    if (score <= 0) continue
    if (!best || score > best.score || (score === best.score && intent.priority > best.priority)) {
      best = { intent: intent.id, score }
    }
  }
  return best ? best.intent : null
}

function phraseIncludes(text, phrase) {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(?:^|\\s)${escaped}(?:\\s|$)`).test(text)
}

export function matchSubjects(raw, subjects) {
  const text = normalize(raw)
  if (!text) return []
  const tokens = text.split(' ').filter(Boolean)
  const exact = []
  const partial = []
  for (const subject of subjects || []) {
    const name = normalize(subject.name)
    const code = normalize(subject.code)
    if ((code && tokens.includes(code)) || (name && phraseIncludes(text, name))) {
      exact.push(subject)
      continue
    }
    const words = name.split(' ').filter((word) => word.length > 3)
    const wordsMatch = words.length > 0 && words.every((word) => tokens.some((token) => token === word || (word.length >= 5 && token.startsWith(word))))
    if (wordsMatch) partial.push(subject)
  }
  return exact.length ? exact : partial
}

export function extractSubject(raw, subjects) {
  const matches = matchSubjects(raw, subjects)
  return matches.length === 1 ? matches[0] : null
}

export function formatDate(value) {
  if (!value) return 'sin fecha'
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(value))
}

function formatScore(score) {
  const value = Number(score)
  return Number.isInteger(value) ? String(value) : String(value)
}

function examsFor(context, subject, type) {
  return (context.exams || []).filter((exam) => String(exam.subjectId) === String(subject.id) && exam.type === type)
}

function enrollmentFor(context, subject) {
  return (context.enrollments || []).find((item) => String(item.subjectId) === String(subject.id))
}

function answerParciales(subject, context) {
  const exams = examsFor(context, subject, 'parcial')
  if (!exams.length) return `No hay parciales cargados para ${subject.name}.`
  const lines = exams.map((exam) => {
    const room = exam.classroom ? ` en el aula ${exam.classroom}` : ''
    return `- ${formatDate(exam.date)}${room}`
  })
  return `Parciales de ${subject.name}:\n${lines.join('\n')}`
}

function answerFinales(subject, context) {
  const exams = examsFor(context, subject, 'final')
  if (!exams.length) return `No hay mesas de final cargadas para ${subject.name}.`
  const lines = exams.map((exam) => {
    const room = exam.classroom ? `, aula ${exam.classroom}` : ''
    const limit = exam.inscriptionDeadline ? `. Límite de inscripción: ${formatDate(exam.inscriptionDeadline)}` : ''
    return `- ${formatDate(exam.date)}${room}${limit}`
  })
  return `Mesas de final de ${subject.name}:\n${lines.join('\n')}`
}

function answerInscripcion(subject, context) {
  const enrollment = enrollmentFor(context, subject)
  if (!enrollment) return `No estás inscripto en ${subject.name}.`
  if (enrollment.status !== 'regular') {
    return `Para inscribirte a la mesa tenés que tener ${subject.name} regularizada. Tu estado actual es ${enrollment.status}.`
  }
  const exams = examsFor(context, subject, 'final')
  if (!exams.length) return `Tenés ${subject.name} regularizada, pero no hay una mesa de final cargada.`
  const exam = [...exams].sort((a, b) => new Date(a.date) - new Date(b.date))[0]
  if (enrollment.inscribedToExam) {
    return `Ya figurás inscripto a la mesa de ${subject.name} del ${formatDate(exam.date)}.`
  }
  const limit = exam.inscriptionDeadline ? formatDate(exam.inscriptionDeadline) : 'sin fecha límite cargada'
  return `Tenés ${subject.name} regularizada y todavía no figurás inscripto a la mesa del ${formatDate(exam.date)}. El límite de inscripción es el ${limit}.`
}

function answerNotas(subject, context) {
  const grades = (context.grades || []).filter((grade) => String(grade.subjectId) === String(subject.id))
  if (!grades.length) return `No tenés nota cargada en ${subject.name}.`
  const lines = grades.map((grade) => `- ${grade.instance}: ${formatScore(grade.score)}`)
  return `Notas de ${subject.name}:\n${lines.join('\n')}`
}

function answerHorarios(subject) {
  if (!subject.schedule) return `No hay horario cargado para ${subject.name}.`
  return `${subject.name} se cursa ${subject.schedule}.`
}

function answerAulas(subject) {
  if (!subject.classroom) return `No hay aula cargada para ${subject.name}.`
  return `${subject.name} se cursa en el aula ${subject.classroom}.`
}

function answerAvisos(context) {
  const notices = context.notices || []
  if (!notices.length) return 'No tenés avisos nuevos.'
  const lines = notices.slice(0, 5).map((notice) => `- ${notice.title}`)
  return `Estos son tus avisos más recientes:\n${lines.join('\n')}`
}

function answerFor(intent, subject, context) {
  if (intent === 'parciales') return answerParciales(subject, context)
  if (intent === 'finales') return answerFinales(subject, context)
  if (intent === 'inscripcion') return answerInscripcion(subject, context)
  if (intent === 'notas') return answerNotas(subject, context)
  if (intent === 'horarios') return answerHorarios(subject)
  if (intent === 'aulas') return answerAulas(subject)
  return 'No pude resolver esa consulta.'
}

export function handleTurn({ text, pendingIntent = null, subjects = [], context = {} }) {
  const detected = detectIntent(text)
  const matches = matchSubjects(text, subjects)
  let intent = detected
  if ((!intent || intent === 'saludo') && pendingIntent && matches.length) intent = pendingIntent
  if (!intent && pendingIntent) intent = pendingIntent

  if (!intent) {
    return {
      reply: 'No estoy seguro de lo que necesitás. Puedo ayudarte con parciales, finales, notas, horarios, aulas, inscripción a mesas y avisos.',
      pendingIntent: null,
      quickReplies: QUICK_REPLIES,
    }
  }

  if (intent === 'saludo') {
    return {
      reply: 'Hola, soy Tomi. Puedo contarte fechas de parciales y finales, horarios, aulas, notas y avisos de tus materias.',
      pendingIntent: null,
      quickReplies: QUICK_REPLIES,
    }
  }

  if (intent === 'ayuda') {
    return {
      reply: 'Preguntame por parciales, finales, notas, horarios, aulas o si ya estás inscripto a una mesa. Si cursás más de una materia, decime cuál.',
      pendingIntent: null,
      quickReplies: QUICK_REPLIES,
    }
  }

  if (intent === 'avisos') {
    return { reply: answerAvisos(context), pendingIntent: null, quickReplies: QUICK_REPLIES }
  }

  if (!NEEDS_SUBJECT.has(intent)) {
    return {
      reply: 'No estoy seguro de lo que necesitás. Puedo ayudarte con parciales, finales, notas, horarios, aulas, inscripción a mesas y avisos.',
      pendingIntent: null,
      quickReplies: QUICK_REPLIES,
    }
  }

  const enrolledIds = new Set((context.enrollments || []).map((item) => String(item.subjectId)))
  const enrolledSubjects = subjects.filter((subject) => enrolledIds.has(String(subject.id)))
  const enrolledMatches = matches.filter((subject) => enrolledIds.has(String(subject.id)))
  const outsideMatches = matches.filter((subject) => !enrolledIds.has(String(subject.id)))

  if (enrolledMatches.length > 1) {
    const names = enrolledMatches.map((subject) => subject.name).join(', ')
    return {
      reply: `¿De cuál? ${names}.`,
      pendingIntent: intent,
      quickReplies: enrolledMatches.map((subject) => subject.name),
    }
  }

  if (outsideMatches.length && enrolledMatches.length === 0) {
    const names = outsideMatches.map((subject) => subject.name).join(' ni en ')
    return {
      reply: `No estás inscripto en ${names}.`,
      pendingIntent: null,
      quickReplies: QUICK_REPLIES,
    }
  }

  let subject = enrolledMatches[0] || null
  if (!subject && !matches.length && enrolledSubjects.length === 1) subject = enrolledSubjects[0]

  if (!subject) {
    const names = enrolledSubjects.map((item) => item.name).join(', ') || 'ninguna materia'
    return {
      reply: `¿De qué materia? Estás inscripto en: ${names}.`,
      pendingIntent: intent,
      quickReplies: enrolledSubjects.map((item) => item.name),
    }
  }

  return {
    reply: answerFor(intent, subject, context),
    pendingIntent: null,
    quickReplies: QUICK_REPLIES,
  }
}

export function buildNoticeMessage(notice, subjectName) {
  const where = subjectName ? ` de ${subjectName}` : ''
  return `Hay una novedad${where}: ${notice.title}. ${notice.body}`
}

export function buildGradeMessage({ subjectName, instance, score }) {
  return `Se cargó una nota de ${instance} en ${subjectName}: ${formatScore(score)}.`
}

export function buildExamChangeMessage({ action, subjectName, type, date, inscriptionDeadline, classroom }) {
  const kind = type === 'final' ? 'final' : 'parcial'
  const when = formatDate(date)
  const room = classroom ? ` El aula es ${classroom}.` : ''
  const limit = type === 'final' && inscriptionDeadline
    ? ` El límite de inscripción es el ${formatDate(inscriptionDeadline)}.`
    : ''
  const current = `La fecha es el ${when}.${room}${limit}`
  if (action === 'creado') return `Se creó un ${kind} de ${subjectName}. ${current}`
  if (action === 'borrado') {
    const oldRoom = classroom ? ` El aula era ${classroom}.` : ''
    const oldLimit = type === 'final' && inscriptionDeadline
      ? ` El límite de inscripción era el ${formatDate(inscriptionDeadline)}.`
      : ''
    return `Se eliminó el ${kind} de ${subjectName}. Estaba previsto para el ${when}.${oldRoom}${oldLimit}`
  }
  return `Se modificó el ${kind} de ${subjectName}. ${current}`
}

export function buildExamReminder({ subjectName, deadline }) {
  return `Tenés ${subjectName} regularizada y todavía no figurás inscripto a la mesa. El límite de inscripción es el ${formatDate(deadline)}. Conviene que te anotes antes de esa fecha.`
}
