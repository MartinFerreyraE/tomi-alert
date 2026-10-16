import { useEffect, useState } from 'react'
import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, Switch,
  Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from '@mui/material'
import api, { errorMessage } from '../../api'
import PageHeader from '../../components/PageHeader'
import SubjectCascade, { YEAR_LABELS } from '../../components/SubjectCascade'

export default function SubjectsPage() {
  const [careers, setCareers] = useState([])
  const [subjects, setSubjects] = useState([])
  const [students, setStudents] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [filter, setFilter] = useState({ careerId: '', year: '1', subjectId: '' })
  const [selected, setSelected] = useState(null)
  const [dialog, setDialog] = useState(null)
  const [form, setForm] = useState({ classroom: '', schedule: '' })
  const [enrollForm, setEnrollForm] = useState({ studentId: '', status: 'cursando' })
  const [error, setError] = useState('')

  async function load() {
    const [careerRes, subjectRes, studentRes] = await Promise.all([
      api.get('/api/careers'), api.get('/api/subjects'), api.get('/api/students'),
    ])
    setCareers(careerRes.data)
    setSubjects(subjectRes.data)
    setStudents(studentRes.data)
    setFilter((current) => ({
      ...current,
      careerId: current.careerId || careerRes.data[0]?._id || '',
    }))
  }

  async function loadEnrollments(subjectId) {
    if (!subjectId) { setEnrollments([]); return }
    const { data } = await api.get('/api/enrollments', { params: { subject: subjectId } })
    setEnrollments(data)
  }

  useEffect(() => { load().catch((err) => setError(errorMessage(err, 'No se pudieron cargar las materias.'))) }, [])
  useEffect(() => { loadEnrollments(selected?._id).catch((err) => setError(errorMessage(err, 'No se pudieron cargar los inscriptos.'))) }, [selected])

  const visible = subjects.filter((subject) => {
    const careerId = subject.career?._id || subject.career
    return String(careerId) === String(filter.careerId) && String(subject.year) === String(filter.year)
  })

  function openEdit(subject) {
    setForm({ id: subject._id, classroom: subject.classroom || '', schedule: subject.schedule || '' })
    setDialog(subject)
  }

  async function saveSubject() {
    setError('')
    try {
      await api.put(`/api/subjects/${form.id}`, { classroom: form.classroom, schedule: form.schedule })
      setDialog(null)
      await load()
    } catch (err) {
      setError(errorMessage(err, 'No se pudo guardar la materia.'))
    }
  }

  async function addEnrollment() {
    setError('')
    try {
      await api.post('/api/enrollments', { ...enrollForm, subjectId: selected._id })
      setEnrollForm({ studentId: '', status: 'cursando' })
      await loadEnrollments(selected._id)
    } catch (err) {
      setError(errorMessage(err, 'No se pudo inscribir al alumno.'))
    }
  }

  async function patchEnrollment(id, changes) {
    setError('')
    try {
      await api.patch(`/api/enrollments/${id}`, changes)
      await loadEnrollments(selected._id)
    } catch (err) {
      setError(errorMessage(err, 'No se pudo actualizar la inscripción.'))
    }
  }

  return (
    <>
      <PageHeader title="Materias" subtitle="Plan fijo de la tecnicatura. Se puede editar el aula y el horario." />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <SubjectCascade
        careers={careers}
        subjects={subjects}
        value={filter}
        onChange={(next) => { setFilter(next); setSelected(null) }}
        requireSubject={false}
      />
      <Typography fontWeight={700} sx={{ mt: 3, mb: 1 }}>{YEAR_LABELS[filter.year] || 'Elegí un año'}</Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Materia</TableCell><TableCell>Aula</TableCell><TableCell>Horario</TableCell><TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {visible.map((subject) => (
            <TableRow key={subject._id} hover selected={selected?._id === subject._id} onClick={() => setSelected(subject)} sx={{ cursor: 'pointer' }}>
              <TableCell>{subject.name}</TableCell>
              <TableCell>{subject.classroom || '—'}</TableCell>
              <TableCell>{subject.schedule || '—'}</TableCell>
              <TableCell align="right">
                <Button size="small" onClick={(event) => { event.stopPropagation(); openEdit(subject) }}>Editar</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Typography fontWeight={700} sx={{ mt: 4, mb: 1 }}>
        Inscriptos {selected ? `en ${selected.name}` : '(elegí una materia)'}
      </Typography>
      {selected && (
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mb: 2 }}>
          <TextField select label="Alumno" value={enrollForm.studentId} onChange={(e) => setEnrollForm({ ...enrollForm, studentId: e.target.value })} sx={{ minWidth: 240 }}>
            {students.map((student) => <MenuItem key={student._id} value={student._id}>{student.name} ({student.legajo})</MenuItem>)}
          </TextField>
          <TextField select label="Estado" value={enrollForm.status} onChange={(e) => setEnrollForm({ ...enrollForm, status: e.target.value })}>
            <MenuItem value="cursando">Cursando</MenuItem>
            <MenuItem value="regular">Regular</MenuItem>
          </TextField>
          <Button variant="outlined" onClick={addEnrollment} disabled={!enrollForm.studentId}>Inscribir</Button>
        </Stack>
      )}
      <Table size="small">
        <TableHead>
          <TableRow><TableCell>Alumno</TableCell><TableCell>Legajo</TableCell><TableCell>Estado</TableCell><TableCell>Inscripto a la mesa</TableCell></TableRow>
        </TableHead>
        <TableBody>
          {enrollments.map((item) => (
            <TableRow key={item._id}>
              <TableCell>{item.student?.name}</TableCell>
              <TableCell>{item.student?.legajo}</TableCell>
              <TableCell>
                <Button size="small" onClick={() => patchEnrollment(item._id, { status: item.status === 'regular' ? 'cursando' : 'regular' })}>
                  {item.status}
                </Button>
              </TableCell>
              <TableCell>
                <Switch checked={item.inscribedToExam} onChange={(e) => patchEnrollment(item._id, { inscribedToExam: e.target.checked })} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={Boolean(dialog)} onClose={() => setDialog(null)} fullWidth>
        <DialogTitle>Aula y horario de {dialog?.name}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Aula" value={form.classroom} onChange={(e) => setForm({ ...form, classroom: e.target.value })} />
            <TextField label="Horario" value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancelar</Button>
          <Button variant="contained" onClick={saveSubject}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
