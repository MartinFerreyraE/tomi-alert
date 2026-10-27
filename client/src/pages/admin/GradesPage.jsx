import { useEffect, useState } from 'react'
import { Alert, Button, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField } from '@mui/material'
import api, { errorMessage } from '../../api'
import PageHeader from '../../components/PageHeader'
import StudentPicker from '../../components/StudentPicker'
import SubjectCascade from '../../components/SubjectCascade'
import { formatDate, normalizeSearch, statusLabel } from '../../utils'

const RECENT_LIMIT = 15

const empty = { studentId: '', careerId: '', year: '', subjectId: '', instance: 'parcial', score: '' }

export default function GradesPage() {
  const [grades, setGrades] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [careers, setCareers] = useState([])
  const [subjects, setSubjects] = useState([])
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [query, setQuery] = useState('')

  async function load() {
    const [gradeRes, enrollmentRes, careerRes, subjectRes] = await Promise.all([
      api.get('/api/grades'), api.get('/api/enrollments'), api.get('/api/careers'), api.get('/api/subjects'),
    ])
    setGrades(gradeRes.data)
    setEnrollments(enrollmentRes.data)
    setCareers(careerRes.data)
    setSubjects(subjectRes.data)
    setForm((current) => ({ ...current, careerId: current.careerId || careerRes.data[0]?._id || '' }))
  }

  useEffect(() => { load().catch((err) => setError(errorMessage(err, 'No se pudieron cargar las notas.'))) }, [])

  async function save(event) {
    event.preventDefault()
    setError('')
    setOk('')
    try {
      await api.post('/api/grades', { ...form, score: Number(form.score) })
      setForm({ ...empty, careerId: careers[0]?._id || '' })
      setOk('Nota cargada. El mail y el mensaje de Tomi salieron según las preferencias del alumno.')
      await load()
    } catch (err) {
      setError(errorMessage(err, 'No se pudo cargar la nota.'))
    }
  }

  const regularStudents = enrollments
    .filter((item) => String(item.subject?._id || item.subject) === String(form.subjectId) && item.status === 'regular' && item.student)
    .map((item) => item.student)
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))

  const needle = normalizeSearch(query.trim())
  const visibleGrades = needle
    ? grades.filter((grade) => normalizeSearch(`${grade.student?.name} ${grade.student?.legajo} ${grade.subject?.name} ${grade.instance}`).includes(needle))
    : grades.slice(0, RECENT_LIMIT)

  return (
    <>
      <PageHeader title="Notas" subtitle="Elegí la materia y cargá la nota a un alumno regular. Sale el mail y Tomi se la deja en el chat, según las preferencias del alumno." />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {ok && <Alert severity="success" sx={{ mb: 2 }}>{ok}</Alert>}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Stack component="form" spacing={1.5} onSubmit={save}>
          <SubjectCascade
            careers={careers}
            subjects={subjects}
            value={form}
            onChange={(next) => setForm({ ...form, ...next, studentId: next.subjectId === form.subjectId ? form.studentId : '' })}
          />
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems="flex-start">
          <StudentPicker
            label="Alumno regular"
            options={regularStudents}
            value={form.studentId}
            onChange={(studentId) => setForm({ ...form, studentId })}
            disabled={!form.subjectId}
            required
            helperText={!form.subjectId ? 'Primero elegí la materia.' : regularStudents.length === 0 ? 'No hay alumnos regulares en esta materia.' : 'Buscá por nombre o legajo.'}
          />
          <TextField select label="Instancia" value={form.instance} onChange={(e) => setForm({ ...form, instance: e.target.value })} sx={{ minWidth: 160 }}>
            <MenuItem value="parcial">Parcial</MenuItem>
            <MenuItem value="recuperatorio">Recuperatorio</MenuItem>
            <MenuItem value="final">Final</MenuItem>
          </TextField>
          <TextField label="Nota" type="number" inputProps={{ min: 0, max: 10, step: 0.5 }} value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })} required sx={{ width: 120 }} />
          <Button type="submit" variant="contained" sx={{ height: 56 }}>Cargar</Button>
          </Stack>
        </Stack>
      </Paper>
      <TextField
        label="Buscar notas"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Alumno, legajo o materia"
        helperText={needle ? `${visibleGrades.length} coincidencias en todas las notas.` : `Últimas ${Math.min(grades.length, RECENT_LIMIT)} notas cargadas.`}
        sx={{ mb: 2, maxWidth: 420 }}
      />
      <Table size="small">
        <TableHead>
          <TableRow><TableCell>Alumno</TableCell><TableCell>Materia</TableCell><TableCell>Instancia</TableCell><TableCell>Nota</TableCell><TableCell>Fecha</TableCell></TableRow>
        </TableHead>
        <TableBody>
          {visibleGrades.length === 0 && (
            <TableRow><TableCell colSpan={5}>{needle ? 'Ninguna nota coincide con la búsqueda.' : 'Todavía no hay notas cargadas.'}</TableCell></TableRow>
          )}
          {visibleGrades.map((grade) => (
            <TableRow key={grade._id}>
              <TableCell>{grade.student?.name}</TableCell>
              <TableCell>{grade.subject?.name}</TableCell>
              <TableCell>{statusLabel(grade.instance)}</TableCell>
              <TableCell>{grade.score}</TableCell>
              <TableCell>{formatDate(grade.loadedAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  )
}
