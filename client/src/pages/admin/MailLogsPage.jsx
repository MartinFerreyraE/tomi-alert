import { useEffect, useState } from 'react'
import {
  Alert, Button, Chip, Link, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from '@mui/material'
import api, { errorMessage } from '../../api'
import PageHeader from '../../components/PageHeader'
import StudentPicker from '../../components/StudentPicker'
import { formatDate, statusLabel } from '../../utils'

const PAGE_SIZE = 50
const color = { enviado: 'success', simulado: 'info', omitido: 'warning', error: 'error' }
const statuses = ['enviado', 'simulado', 'omitido', 'error']
const emptyFilters = { status: 'todos', studentId: '', from: '', to: '' }

function countLabel(total) {
  return `${total} envío${total === 1 ? '' : 's'}`
}

export default function MailLogsPage() {
  const [logs, setLogs] = useState([])
  const [students, setStudents] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState(emptyFilters)
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/students').then((response) => setStudents(response.data)).catch(() => {})
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 300)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    const invalidRange = filters.from && filters.to && filters.from > filters.to
    if (invalidRange) {
      setLoading(false)
      return undefined
    }

    const params = { page, limit: PAGE_SIZE }
    if (filters.status !== 'todos') params.status = filters.status
    if (filters.studentId) params.studentId = filters.studentId
    if (filters.from) params.from = filters.from
    if (filters.to) params.to = filters.to
    if (search) params.q = search

    let cancelled = false
    setLoading(true)
    api.get('/api/mail-logs', { params })
      .then((response) => {
        if (cancelled) return
        setLogs(response.data.items)
        setTotal(response.data.total)
        setError('')
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, 'No se pudieron cargar los envíos.'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [filters, page, search])

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const invalidRange = filters.from && filters.to && filters.from > filters.to
  const filtering = filters.status !== 'todos' || filters.studentId || filters.from || filters.to || search
  function updateFilters(next) {
    setFilters(next)
    setPage(1)
  }

  function clearFilters() {
    setFilters(emptyFilters)
    setQuery('')
    setSearch('')
    setPage(1)
  }

  return (
    <>
      <PageHeader title="Envíos" subtitle="Quién recibió el mail, quién lo tiene desactivado y si el envío fue real o simulado." />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {invalidRange && <Alert severity="warning" sx={{ mb: 2 }}>La fecha desde tiene que ser anterior o igual a la fecha hasta.</Alert>}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack spacing={4}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems="flex-start">
            <TextField
              select
              label="Estado"
              value={filters.status}
              onChange={(event) => updateFilters({ ...filters, status: event.target.value })}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="todos">Todos</MenuItem>
              {statuses.map((status) => <MenuItem key={status} value={status}>{statusLabel(status)}</MenuItem>)}
            </TextField>
            <StudentPicker
              label="Alumno"
              options={students}
              value={filters.studentId}
              helperText={null}
              onChange={(studentId) => updateFilters({ ...filters, studentId })}
            />
            <TextField
              label="Buscar"
              placeholder="Asunto, mail o detalle"
              value={query}
              onChange={(event) => { setQuery(event.target.value); setPage(1) }}
              sx={{ minWidth: 220, flex: 1 }}
            />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="flex-start">
            <TextField
              label="Desde"
              type="date"
              value={filters.from}
              onChange={(event) => updateFilters({ ...filters, from: event.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ width: { xs: '100%', sm: 180 } }}
            />
            <TextField
              label="Hasta"
              type="date"
              value={filters.to}
              onChange={(event) => updateFilters({ ...filters, to: event.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ width: { xs: '100%', sm: 180 } }}
            />
            {filtering && <Button onClick={clearFilters} sx={{ height: 56 }}>Limpiar</Button>}
          </Stack>
        </Stack>
      </Paper>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {loading ? 'Cargando envíos...' : countLabel(total)}
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Fecha</TableCell><TableCell>Asunto</TableCell><TableCell>Alumno</TableCell><TableCell>Estado</TableCell><TableCell>Detalle</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {!loading && logs.length === 0 && (
            <TableRow><TableCell colSpan={5}>{filtering ? 'No hay envíos con este filtro.' : 'Todavía no hay envíos.'}</TableCell></TableRow>
          )}
          {logs.map((log) => (
            <TableRow key={log._id}>
              <TableCell>{formatDate(log.createdAt)}</TableCell>
              <TableCell>{log.notice?.title || log.title}</TableCell>
              <TableCell>{log.student?.name}<br />{log.student?.email}</TableCell>
              <TableCell><Chip size="small" label={statusLabel(log.status)} color={color[log.status] || 'default'} /></TableCell>
              <TableCell>
                {String(log.detail).startsWith('http')
                  ? <Link href={log.detail} target="_blank" rel="noreferrer">Ver correo</Link>
                  : log.detail}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {pages > 1 && (
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end" sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">Página {page} de {pages}</Typography>
          <Button disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Anterior</Button>
          <Button disabled={page >= pages} onClick={() => setPage((current) => current + 1)}>Siguiente</Button>
        </Stack>
      )}
    </>
  )
}
