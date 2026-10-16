import { useEffect, useState } from 'react'
import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack,
  Table, TableBody, TableCell, TableHead, TableRow, TextField,
} from '@mui/material'
import api, { errorMessage } from '../../api'
import PageHeader from '../../components/PageHeader'
import SubjectCascade from '../../components/SubjectCascade'
import { formatDate, toDateInput } from '../../utils'

const empty = { careerId: '', year: '', subjectId: '', type: 'parcial', date: '', inscriptionDeadline: '', classroom: '' }

export default function ExamsPage() {
  const [exams, setExams] = useState([])
  const [careers, setCareers] = useState([])
  const [subjects, setSubjects] = useState([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')

  async function load() {
    const [examRes, careerRes, subjectRes] = await Promise.all([
      api.get('/api/exams'), api.get('/api/careers'), api.get('/api/subjects'),
    ])
    setExams(examRes.data)
    setCareers(careerRes.data)
    setSubjects(subjectRes.data)
  }

  useEffect(() => { load().catch((err) => setError(errorMessage(err, 'No se pudieron cargar las mesas.'))) }, [])

  function openCreate() {
    setForm({ ...empty, careerId: careers[0]?._id || '' })
    setOpen(true)
  }

  function edit(exam) {
    const subjectId = exam.subject?._id || exam.subject
    const subject = subjects.find((item) => item._id === subjectId)
    setForm({
      id: exam._id,
      careerId: subject?.career?._id || subject?.career || careers[0]?._id || '',
      year: subject ? String(subject.year) : '',
      subjectId,
      type: exam.type,
      date: toDateInput(exam.date),
      inscriptionDeadline: toDateInput(exam.inscriptionDeadline),
      classroom: exam.classroom || '',
    })
    setOpen(true)
  }

  async function save() {
    setError('')
    const payload = { ...form, subjectId: form.subjectId }
    try {
      if (form.id) await api.put(`/api/exams/${form.id}`, payload)
      else await api.post('/api/exams', payload)
      setOpen(false)
      await load()
    } catch (err) {
      setError(errorMessage(err, 'No se pudo guardar la mesa.'))
    }
  }

  async function remove(id) {
    setError('')
    try {
      await api.delete(`/api/exams/${id}`)
      await load()
    } catch (err) {
      setError(errorMessage(err, 'No se pudo borrar la mesa.'))
    }
  }

  return (
    <>
      <PageHeader title="Mesas y parciales" subtitle="Fechas, aula y límite de inscripción." action={<Button variant="contained" onClick={openCreate}>Nueva fecha</Button>} />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Materia</TableCell><TableCell>Tipo</TableCell><TableCell>Fecha</TableCell><TableCell>Límite</TableCell><TableCell>Aula</TableCell><TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {exams.map((exam) => (
            <TableRow key={exam._id}>
              <TableCell>{exam.subject?.name}</TableCell>
              <TableCell>{exam.type}</TableCell>
              <TableCell>{formatDate(exam.date)}</TableCell>
              <TableCell>{formatDate(exam.inscriptionDeadline)}</TableCell>
              <TableCell>{exam.classroom || '—'}</TableCell>
              <TableCell align="right">
                <Button size="small" onClick={() => edit(exam)}>Editar</Button>
                <Button size="small" color="error" onClick={() => remove(exam._id)}>Borrar</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{form.id ? 'Editar fecha' : 'Nueva fecha'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <SubjectCascade careers={careers} subjects={subjects} value={form} onChange={(next) => setForm({ ...form, ...next })} />
            <TextField select label="Tipo" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <MenuItem value="parcial">Parcial</MenuItem>
              <MenuItem value="final">Final</MenuItem>
            </TextField>
            <TextField label="Fecha" type="date" InputLabelProps={{ shrink: true }} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <TextField label="Límite de inscripción" type="date" InputLabelProps={{ shrink: true }} value={form.inscriptionDeadline} onChange={(e) => setForm({ ...form, inscriptionDeadline: e.target.value })} />
            <TextField label="Aula" value={form.classroom} onChange={(e) => setForm({ ...form, classroom: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={save}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
