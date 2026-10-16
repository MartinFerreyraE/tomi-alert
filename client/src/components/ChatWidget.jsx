import { useEffect, useRef, useState } from 'react'
import {
  Badge, Box, Chip, Fab, IconButton, Paper, Stack, TextField, Typography,
} from '@mui/material'
import ChatIcon from '@mui/icons-material/Chat'
import CloseIcon from '@mui/icons-material/Close'
import SendIcon from '@mui/icons-material/Send'
import api, { errorMessage } from '../api'

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [quickReplies, setQuickReplies] = useState([])
  const [unread, setUnread] = useState(0)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)

  async function load() {
    const { data } = await api.get('/api/chat')
    setMessages(data.messages)
    setQuickReplies(data.quickReplies || [])
    setUnread(open ? 0 : (data.unread || 0))
  }

  useEffect(() => {
    let active = true
    async function refresh() {
      try {
        const { data } = await api.get('/api/chat')
        if (!active) return
        setMessages(data.messages)
        setQuickReplies(data.quickReplies || [])
        setUnread(open ? 0 : (data.unread || 0))
        if (open && data.unread) await api.post('/api/chat/read')
      } catch {
        /* el panel sigue usable si la API tarda en responder */
      }
    }
    refresh()
    const timer = setInterval(refresh, 8000)
    return () => { active = false; clearInterval(timer) }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  async function toggle() {
    const next = !open
    setOpen(next)
    if (next) {
      await api.post('/api/chat/read').catch(() => {})
      setUnread(0)
    }
  }

  async function send(value) {
    const content = (value ?? text).trim()
    if (!content) return
    setSending(true)
    setError('')
    setText('')
    try {
      await api.post('/api/chat', { text: content })
      await load()
    } catch (err) {
      setError(errorMessage(err, 'Tomi no pudo responder.'))
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {open && (
        <Paper elevation={8} sx={{ position: 'fixed', right: 16, bottom: 88, width: { xs: 'calc(100vw - 32px)', sm: 380 }, height: 520, zIndex: 1300, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Stack direction="row" alignItems="center" sx={{ px: 2, py: 1.5, bgcolor: 'primary.main', color: 'white' }}>
            <Box sx={{ flex: 1 }}>
              <Typography fontWeight={800}>Tomi</Typography>
              <Typography variant="caption">Consultas de tus materias</Typography>
            </Box>
            <IconButton size="small" sx={{ color: 'white' }} onClick={toggle} aria-label="Cerrar chat"><CloseIcon /></IconButton>
          </Stack>
          <Box sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: '#EEF3F8' }}>
            {messages.length === 0 && (
              <Typography variant="body2" color="text.secondary">Hola, soy Tomi. Elegí una opción o escribime.</Typography>
            )}
            <Stack spacing={1}>
              {messages.map((message) => {
                const mine = message.author === 'alumno'
                return (
                  <Box key={message._id} sx={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                    {message.proactive && <Chip size="small" label="Novedad" color="secondary" sx={{ mb: 0.5 }} />}
                    <Paper sx={{ px: 1.5, py: 1, bgcolor: mine ? 'primary.main' : 'white', color: mine ? 'white' : 'text.primary' }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{message.text}</Typography>
                    </Paper>
                  </Box>
                )
              })}
              <div ref={bottomRef} />
            </Stack>
          </Box>
          {error && <Typography variant="caption" color="error" sx={{ px: 2 }}>{error}</Typography>}
          <Stack direction="row" spacing={0.5} sx={{ px: 1.5, pt: 1, overflowX: 'auto' }}>
            {quickReplies.map((reply) => (
              <Chip key={reply} label={reply} size="small" onClick={() => send(reply)} disabled={sending} />
            ))}
          </Stack>
          <Stack direction="row" spacing={1} sx={{ p: 1.5 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Escribí tu consulta"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') send() }}
            />
            <IconButton color="primary" onClick={() => send()} disabled={sending} aria-label="Enviar"><SendIcon /></IconButton>
          </Stack>
        </Paper>
      )}
      <Fab color="primary" onClick={toggle} aria-label="Abrir chat de Tomi" sx={{ position: 'fixed', right: 16, bottom: 16, zIndex: 1300 }}>
        <Badge color="secondary" badgeContent={unread}><ChatIcon /></Badge>
      </Fab>
    </>
  )
}
