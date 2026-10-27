import { useEffect, useState } from 'react'
import {
  Alert, Autocomplete, Button, Chip, MenuItem, Paper, Stack, TextField, Typography,
} from '@mui/material'
import api, { errorMessage } from '../../api'
import PageHeader from '../../components/PageHeader'
import SubjectCascade from '../../components/SubjectCascade'
import { formatDate, statusLabel } from '../../utils'

const empty = { title: '', body: '', type: 'aula', careerId: '', year: '', subjectId: '', recipientIds: [] }

export default function NoticesPage() {
  const [notices, setNotices] = useState([])
  const [careers, setCareers] = useState([])
  const [subjects, setSubjects] = useState([])
  const [students, setStudents] = useState([])
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  async function load() {
    const [careerRes, noticeRes, subjectRes, studentRes] = await Promise.all([
      api.get('/api/careers'), api.get('/api/notices'), api.get('/api/subjects'), api.get('/api/students'),
    ])
    setCareers(careerRes.data)
    setNotices(noticeRes.data)
    setSubjects(subjectRes.data)
    setStudents(studentRes.data)
    setForm((current) => ({ ...current, careerId: current.careerId || careerRes.data[0]?._id || '' }))
  }

  useEffect(() => { load().catch((err) => setError(errorMessage(err, 'No se pudieron cargar los avisos.'))) }, [])

  async function publish(event) {
    event.preventDefault()
    setError('')
    setOk('')
    try {
      await api.post('/api/notices', {
        ...form,
        recipientIds: form.recipientIds.map((student) => student._id),
      })
      setForm({ ...empty, careerId: careers[0]?._id || '' })
      setOk('Aviso publicado. Los mails y los mensajes de Tomi salieron según las preferencias de cada alumno.')
      await load()
    } catch (err) {
      setError(errorMessage(err, 'No se pudo publicar el aviso.'))
    }
  }

  async function resend(id) {
    setError('')
    setOk('')
    try {
      await api.post(`/api/notices/${id}/resend`)
      setOk('Reenvío de mail registrado.')
      await load()
    } catch (err) {
      setError(errorMessage(err, 'No se pudo reenviar el aviso.'))
    }
  }

  return (
    <>
      <PageHeader title="Avisos" subtitle="Cambios de horario, de aula, o un mensaje a alumnos puntuales. Las notas se cargan en Notas." />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {ok && <Alert severity="success" sx={{ mb: 2 }}>{ok}</Alert>}
      <Paper variant="outlined" component="form" onSubmit={publish} sx={{ p: 2, mb: 3 }}>
        <Stack spacing={2}>
          <TextField label="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <TextField label="Mensaje" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required multiline minRows={3} />
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField select label="Tipo" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} sx={{ minWidth: 180 }}>
              <MenuItem value="horario">Horario</MenuItem>
              <MenuItem value="aula">Aula</MenuItem>
              <MenuItem value="personalizado">Personalizado</MenuItem>
            </TextField>
            {form.type !== 'personalizado' ? (
              <SubjectCascade careers={careers} subjects={subjects} value={form} onChange={(next) => setForm({ ...form, ...next })} />
            ) : (
              <Autocomplete
                multiple
                options={students}
                value={form.recipientIds}
                onChange={(_e, value) => setForm({ ...form, recipientIds: value })}
                getOptionLabel={(option) => `${option.name} (${option.legajo})`}
                isOptionEqualToValue={(option, value) => option._id === value._id}
                renderInput={(params) => <TextField {...params} label="Alumnos" />}
                sx={{ minWidth: 280, flex: 1 }}
              />
            )}
          </Stack>
          <Button type="submit" variant="contained" sx={{ alignSelf: 'flex-start' }}>Publicar</Button>
        </Stack>
      </Paper>
      <Stack spacing={1.5}>
        {notices.length === 0 && <Typography color="text.secondary">Todavía no hay avisos.</Typography>}
        {notices.map((notice) => (
          <Paper key={notice._id} variant="outlined" sx={{ p: 2 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
              <div>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography fontWeight={700}>{notice.title}</Typography>
                  <Chip size="small" label={statusLabel(notice.type)} />
                </Stack>
                <Typography variant="body2" sx={{ mt: 0.5 }}>{notice.body}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {notice.subject?.name || 'Personalizado'} · {notice.recipients?.length || 0} destinatarios · {formatDate(notice.createdAt)}
                </Typography>
              </div>
              <Button onClick={() => resend(notice._id)}>Reenviar mail</Button>
            </Stack>
          </Paper>
        ))}
      </Stack>
    </>
  )
}
