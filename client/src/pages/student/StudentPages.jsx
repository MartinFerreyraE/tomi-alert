import { useEffect, useState } from 'react'
import {
  Alert, Card, CardContent, Chip, FormControlLabel, Grid, Stack, Switch, Table, TableBody,
  TableCell, TableHead, TableRow, Typography,
} from '@mui/material'
import api, { errorMessage } from '../../api'
import PageHeader from '../../components/PageHeader'
import { YEAR_LABELS } from '../../components/SubjectCascade'
import { formatDate, formatSchedule, statusLabel } from '../../utils'

function useStudentData() {
  const [subjects, setSubjects] = useState([])
  const [grades, setGrades] = useState([])
  const [exams, setExams] = useState([])
  const [notices, setNotices] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.get('/api/subjects'), api.get('/api/grades'), api.get('/api/exams'), api.get('/api/notices')])
      .then(([subjectRes, gradeRes, examRes, noticeRes]) => {
        setSubjects(subjectRes.data)
        setGrades(gradeRes.data)
        setExams(examRes.data)
        setNotices(noticeRes.data)
      })
      .catch((err) => setError(errorMessage(err, 'No se pudieron cargar tus datos.')))
  }, [])

  return { subjects, grades, exams, notices, error }
}

export function StudentHome() {
  const { subjects, error } = useStudentData()
  const careerName = subjects[0]?.career?.name
  return (
    <>
      <PageHeader title="Mis materias" subtitle={careerName || 'Horario, aula y estado de cursada. Tomi está en el botón de abajo a la derecha.'} />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Grid container spacing={2}>
        {subjects.map((subject) => (
          <Grid item xs={12} md={6} key={subject._id} sx={{ display: 'flex' }}>
            <Card variant="outlined" sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                  <Typography fontWeight={800}>{subject.name}</Typography>
                  <Chip size="small" label={statusLabel(subject.enrollmentStatus)} color={subject.enrollmentStatus === 'regular' ? 'success' : 'info'} />
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Aula {subject.classroom || '—'}</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>{formatSchedule(subject.schedule)}</Typography>
                {subject.enrollmentStatus === 'regular' && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Mesa: {subject.inscribedToExam ? 'Ya figurás inscripto' : 'Todavía no figurás inscripto'}
                  </Typography>
                )}
                <Typography variant="body2" color="primary" fontWeight={700} sx={{ mt: 'auto', pt: 2, textAlign: 'right' }}>
                  {YEAR_LABELS[subject.year]}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </>
  )
}

export function StudentGrades() {
  const { grades, error } = useStudentData()
  return (
    <>
      <PageHeader title="Notas" subtitle="Solo ves las notas de tus materias." />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Table size="small">
        <TableHead><TableRow><TableCell>Materia</TableCell><TableCell>Instancia</TableCell><TableCell>Nota</TableCell><TableCell>Fecha</TableCell></TableRow></TableHead>
        <TableBody>
          {grades.length === 0 && <TableRow><TableCell colSpan={4}>Todavía no hay notas cargadas.</TableCell></TableRow>}
          {grades.map((grade) => (
            <TableRow key={grade._id}>
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

export function StudentExams() {
  const { exams, error } = useStudentData()
  return (
    <>
      <PageHeader title="Parciales y mesas" subtitle="Fechas de las materias en las que estás inscripto." />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Table size="small">
        <TableHead><TableRow><TableCell>Materia</TableCell><TableCell>Tipo</TableCell><TableCell>Fecha</TableCell><TableCell>Límite de inscripción</TableCell><TableCell>Aula</TableCell></TableRow></TableHead>
        <TableBody>
          {exams.map((exam) => (
            <TableRow key={exam._id}>
              <TableCell>{exam.subject?.name}</TableCell>
              <TableCell>{statusLabel(exam.type)}</TableCell>
              <TableCell>{formatDate(exam.date)}</TableCell>
              <TableCell>{formatDate(exam.inscriptionDeadline)}</TableCell>
              <TableCell>{exam.classroom || exam.subject?.classroom || '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  )
}

export function StudentNotices() {
  const { notices, error } = useStudentData()
  return (
    <>
      <PageHeader title="Avisos" subtitle="Novedades dirigidas a vos." />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Stack spacing={1.5}>
        {notices.length === 0 && <Typography color="text.secondary">No tenés avisos.</Typography>}
        {notices.map((notice) => (
          <Card key={notice._id} variant="outlined">
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography fontWeight={700}>{notice.title}</Typography>
                <Chip size="small" label={statusLabel(notice.type)} />
              </Stack>
              <Typography variant="body2" sx={{ mt: 1 }}>{notice.body}</Typography>
              <Typography variant="caption" color="text.secondary">{notice.subject?.name} · {formatDate(notice.createdAt)}</Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </>
  )
}

export function PreferencesPage() {
  const [prefs, setPrefs] = useState({ emailEnabled: true, tomiEnabled: true })
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.get('/api/preferences').then((response) => setPrefs(response.data)).catch((err) => setError(errorMessage(err, 'No se pudieron cargar las preferencias.')))
  }, [])

  async function update(next) {
    setPrefs(next)
    setSaved(false)
    setError('')
    try {
      const { data } = await api.put('/api/preferences', next)
      setPrefs(data)
      setSaved(true)
    } catch (err) {
      setError(errorMessage(err, 'No se pudieron guardar las preferencias.'))
    }
  }

  return (
    <>
      <PageHeader title="Preferencias" subtitle="Decidís si los avisos te llegan por mail y si Tomi te escribe en el panel." />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {saved && <Alert severity="success" sx={{ mb: 2 }}>Preferencias guardadas.</Alert>}
      <Card variant="outlined" sx={{ maxWidth: 560 }}>
        <CardContent>
          <FormControlLabel
            control={<Switch checked={prefs.emailEnabled} onChange={(e) => update({ ...prefs, emailEnabled: e.target.checked })} />}
            label="Recibir avisos por email"
          />
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, ml: 6 }}>
            Si lo desactivás, el aviso sigue en esta pantalla, pero no sale el correo.
          </Typography>
          <FormControlLabel
            control={<Switch checked={prefs.tomiEnabled} onChange={(e) => update({ ...prefs, tomiEnabled: e.target.checked })} />}
            label="Recibir mensajes de Tomi"
          />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 6 }}>
            Novedades de notas, avisos y el recordatorio para inscribirte a una mesa.
          </Typography>
        </CardContent>
      </Card>
    </>
  )
}
