import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material'
import { errorMessage } from '../api'
import { useAuth } from '../auth/AuthContext'

const demos = [
  ['Administración', 'admin', 'Admin123!'],
  ['Ana (mail y Tomi activos)', '40111222', 'Alumno123!'],
  ['Luis (mail desactivado)', '38999888', 'Alumno123!'],
]

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [document, setDocument] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(document, password)
      navigate(user.role === 'admin' ? '/admin' : '/alumno')
    } catch (err) {
      setError(errorMessage(err, 'No se pudo iniciar sesión.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.1fr 0.9fr' } }}>
      <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', justifyContent: 'space-between', p: 6, color: 'white', background: 'linear-gradient(160deg, #0D47A1 0%, #1565C0 55%, #F9A825 160%)' }}>
        <Typography variant="h5" fontWeight={800}>Tomi-Alert</Typography>
        <Box>
          <Typography variant="h3" fontWeight={800} sx={{ maxWidth: 460 }}>Avisos académicos, en el mail y en el chat.</Typography>
          <Typography sx={{ mt: 2, maxWidth: 460, opacity: 0.92 }}>
            Info alumnos envía novedades a los alumnos. Tomi responde fechas, notas y recordatorios dentro del panel del alumno.
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>Tecnicatura en Desarrollo y Calidad de Software</Typography>
      </Box>
      <Box sx={{ display: 'grid', placeItems: 'center', p: 3 }}>
        <Paper elevation={0} sx={{ p: 4, width: '100%', maxWidth: 420, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h5" fontWeight={800}>Autogestión Alumnos</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>Por favor, ingrese su DNI o pasaporte.</Typography>
          <Stack component="form" spacing={2} onSubmit={onSubmit}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="DNI o pasaporte" value={document} onChange={(e) => setDocument(e.target.value)} required autoComplete="username" />
            <TextField label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
            <Button type="submit" variant="contained" size="large" disabled={loading}>{loading ? 'Ingresando...' : 'Entrar'}</Button>
          </Stack>
          <Stack spacing={1} sx={{ mt: 3 }}>
            {demos.map(([label, demoDocument, demoPassword]) => (
              <Button key={demoDocument} size="small" onClick={() => { setDocument(demoDocument); setPassword(demoPassword) }}>
                {label}: {demoDocument}
              </Button>
            ))}
          </Stack>
        </Paper>
      </Box>
    </Box>
  )
}
