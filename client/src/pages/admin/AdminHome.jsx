import { useEffect, useState } from 'react'
import { Alert, Button, Card, CardContent, Grid, Stack, Typography } from '@mui/material'
import api, { errorMessage } from '../../api'
import PageHeader from '../../components/PageHeader'

const cards = [
  ['students', 'Alumnos'],
  ['subjects', 'Materias'],
  ['notices', 'Avisos'],
  ['mailsSent', 'Mails registrados'],
  ['mailsSkipped', 'Mails omitidos'],
]

export default function AdminHome() {
  const [stats, setStats] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/api/stats').then((response) => setStats(response.data)).catch((err) => setError(errorMessage(err, 'No se pudieron cargar los datos.')))
  }, [])

  async function runReminders() {
    setMessage('')
    setError('')
    try {
      const { data } = await api.post('/api/reminders/run')
      setMessage(data.created ? `Tomi dejó ${data.created} recordatorio${data.created === 1 ? '' : 's'} de inscripción.` : 'No había recordatorios nuevos para enviar.')
    } catch (err) {
      setError(errorMessage(err, 'No se pudieron generar los recordatorios.'))
    }
  }

  return (
    <>
      <PageHeader title="Panel administrativo" subtitle="Publicá avisos, cargá notas y revisá qué mails salieron." />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      <Grid container spacing={2}>
        {cards.map(([key, label]) => (
          <Grid item xs={12} sm={6} md={4} key={key}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary">{label}</Typography>
                <Typography variant="h4" fontWeight={800}>{stats ? stats[key] : '—'}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Card variant="outlined" sx={{ mt: 3 }}>
        <CardContent>
          <Typography fontWeight={700} gutterBottom>Recorrido de la defensa</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            1. Publicá un cambio de aula en Avisos: Tecnicatura, Segundo Año, Fund. del Control de Calidad. Ana recibe el mail simulado y Luis queda omitido porque desactivó el email.
            2. Cargá una nota: Tomi se la deja en el chat a quien tenga los mensajes activos.
            3. Generá los recordatorios de mesa. Ana, con Fund. del Control de Calidad regularizada y sin inscripción, recibe el aviso de Tomi.
          </Typography>
          <Stack direction="row">
            <Button variant="contained" onClick={runReminders}>Generar recordatorios de mesa</Button>
          </Stack>
        </CardContent>
      </Card>
    </>
  )
}
