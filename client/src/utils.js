const WEEKDAYS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']

export function formatSchedule(schedule) {
  if (!schedule) return ''
  return WEEKDAYS.reduce(
    (text, day) => text.replaceAll(day, day.charAt(0).toUpperCase() + day.slice(1)),
    schedule,
  )
}

export function normalizeSearch(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function statusLabel(status) {
  if (!status) return ''
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(value))
}

export function toDateInput(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}
