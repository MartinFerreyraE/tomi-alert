import { useEffect, useState } from 'react'
import { Alert, Chip, Link, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material'
import api, { errorMessage } from '../../api'
import PageHeader from '../../components/PageHeader'
import { formatDate } from '../../utils'

const color = { enviado: 'success', simulado: 'info', omitido: 'warning', error: 'error' }

export default function MailLogsPage() {
  const [logs, setLogs] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/api/mail-logs').then((response) => setLogs(response.data)).catch((err) => setError(errorMessage(err, 'No se pudieron cargar los envíos.')))
  }, [])

  return (
    <>
      <PageHeader title="Envíos" subtitle="Quién recibió el mail, quién lo tiene desactivado y si el envío fue real o simulado." />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Fecha</TableCell><TableCell>Aviso</TableCell><TableCell>Alumno</TableCell><TableCell>Estado</TableCell><TableCell>Detalle</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log._id}>
              <TableCell>{formatDate(log.createdAt)}</TableCell>
              <TableCell>{log.notice?.title}</TableCell>
              <TableCell>{log.student?.name}<br />{log.student?.email}</TableCell>
              <TableCell><Chip size="small" label={log.status} color={color[log.status] || 'default'} /></TableCell>
              <TableCell>
                {String(log.detail).startsWith('http')
                  ? <Link href={log.detail} target="_blank" rel="noreferrer">Ver correo</Link>
                  : log.detail}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  )
}
