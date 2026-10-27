import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Box, Card, CardActionArea, Grid, Stack, Typography } from '@mui/material'
import CampaignIcon from '@mui/icons-material/Campaign'
import EmailIcon from '@mui/icons-material/Email'
import EventIcon from '@mui/icons-material/Event'
import GradeIcon from '@mui/icons-material/Grade'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import ScheduleIcon from '@mui/icons-material/Schedule'
import api, { errorMessage } from '../../api'
import PageHeader from '../../components/PageHeader'

const tasks = [
  {
    title: 'Mesas y parciales',
    description: 'Cargá una fecha, o editá el día, el aula y el límite de inscripción.',
    to: '/admin/mesas',
    icon: <EventIcon />,
  },
  {
    title: 'Horarios y aulas',
    description: 'Actualizá el aula y el horario de cada materia del plan.',
    to: '/admin/materias',
    icon: <ScheduleIcon />,
  },
  {
    title: 'Avisos',
    description: 'Publicá un cambio de horario, de aula o un mensaje personalizado.',
    to: '/admin/avisos',
    icon: <CampaignIcon />,
  },
  {
    title: 'Notas',
    description: 'Cargá una nota a un alumno regular de la materia.',
    to: '/admin/notas',
    icon: <GradeIcon />,
  },
  {
    title: 'Envíos',
    description: 'Revisá qué mails salieron, cuáles se simularon y cuáles quedaron omitidos.',
    to: '/admin/envios',
    icon: <EmailIcon />,
  },
  {
    title: 'Recordatorios de mesa',
    description: 'Avisá por Tomi a quien esté regular y todavía no se inscribió.',
    action: 'reminders',
    icon: <NotificationsActiveIcon />,
  },
]

const notes = [
  {
    title: 'Un aviso de aula no le llega a todos',
    body: 'En Fund. del Control de Calidad, Martin recibe el mail. Luis lo tiene desactivado, así que ese envío queda omitido. Los dos figuran en Envíos.',
  },
  {
    title: 'La nota sale por mail y por el chat',
    body: 'Se carga en Notas, no como aviso. Tomi se la deja a quien tenga los mensajes activos. María tiene Tomi desactivado, así que a ella solo le llega el mail.',
  },
  {
    title: 'Martin todavía no está inscripto a Calidad',
    body: 'Tiene Fund. del Control de Calidad regularizada y sin inscripción. Al generar los recordatorios, Tomi le avisa en el chat.',
  },
  {
    title: 'Tocar una fecha también avisa',
    body: 'Crear, editar o borrar una mesa o un parcial avisa a los alumnos de esa materia, con la información nueva o con la cancelación.',
  },
]

function summaryLine(stats) {
  if (!stats) return 'Cargando el resumen del panel.'
  return `${stats.students} alumnos, ${stats.subjects} materias, ${stats.notices} aviso${stats.notices === 1 ? '' : 's'}, ${stats.mailsSent} mail${stats.mailsSent === 1 ? '' : 's'} registrado${stats.mailsSent === 1 ? '' : 's'} y ${stats.mailsSkipped} omitido${stats.mailsSkipped === 1 ? '' : 's'}.`
}

export default function AdminHome() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [running, setRunning] = useState(false)

  useEffect(() => {
    api.get('/api/stats').then((response) => setStats(response.data)).catch((err) => setError(errorMessage(err, 'No se pudieron cargar los datos.')))
  }, [])

  async function runReminders() {
    setMessage('')
    setError('')
    setRunning(true)
    try {
      const { data } = await api.post('/api/reminders/run')
      setMessage(data.created ? `Tomi dejó ${data.created} recordatorio${data.created === 1 ? '' : 's'} de inscripción.` : 'No había recordatorios nuevos para enviar.')
      const statsResponse = await api.get('/api/stats')
      setStats(statsResponse.data)
    } catch (err) {
      setError(errorMessage(err, 'No se pudieron generar los recordatorios.'))
    } finally {
      setRunning(false)
    }
  }

  function openTask(task) {
    if (task.action === 'reminders') {
      if (!running) runReminders()
      return
    }
    navigate(task.to)
  }

  return (
    <>
      <PageHeader title="Panel administrativo" subtitle="Elegí una tarea del día y revisá los casos que conviene tener presentes." />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

      <Typography variant="h5" fontWeight={800}>¿Qué vamos a hacer hoy?</Typography>
      <Typography color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
        Estas son las tareas del panel. Cada una avisa a los alumnos cuando corresponde.
      </Typography>
      <Grid container spacing={2}>
        {tasks.map((task) => (
          <Grid item xs={12} sm={6} md={4} key={task.title}>
            <Card variant="outlined" sx={{ height: '100%', '&:hover': { borderColor: 'primary.main' } }}>
              <CardActionArea
                onClick={() => openTask(task)}
                disabled={task.action === 'reminders' && running}
                sx={{ height: '100%', p: 2.25, alignItems: 'stretch' }}
              >
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <Box sx={{ width: 42, height: 42, borderRadius: 2, flexShrink: 0, display: 'grid', placeItems: 'center', bgcolor: 'primary.main', color: 'common.white' }}>
                    {task.icon}
                  </Box>
                  <Box>
                    <Typography fontWeight={800}>{task.action === 'reminders' && running ? 'Generando recordatorios...' : task.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{task.description}</Typography>
                  </Box>
                </Stack>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h5" fontWeight={800} sx={{ mt: 4 }}>Para tener en cuenta</Typography>
      <Typography color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
        {summaryLine(stats)} Estos casos muestran cómo se comporta el aviso.
      </Typography>
      <Grid container spacing={2}>
        {notes.map((note) => (
          <Grid item xs={12} md={6} key={note.title}>
            <Card variant="outlined" sx={{ height: '100%', borderLeft: '4px solid', borderLeftColor: 'primary.main' }}>
              <Box sx={{ p: 2.25 }}>
                <Typography fontWeight={800}>{note.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>{note.body}</Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </>
  )
}
