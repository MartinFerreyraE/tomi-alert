import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  AppBar, Avatar, Box, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText,
  Toolbar, Typography, useMediaQuery,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import MenuIcon from '@mui/icons-material/Menu'
import DashboardIcon from '@mui/icons-material/Dashboard'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import EventIcon from '@mui/icons-material/Event'
import GradeIcon from '@mui/icons-material/Grade'
import CampaignIcon from '@mui/icons-material/Campaign'
import EmailIcon from '@mui/icons-material/Email'
import LogoutIcon from '@mui/icons-material/Logout'
import SettingsIcon from '@mui/icons-material/Settings'
import SchoolIcon from '@mui/icons-material/School'
import { useAuth } from '../auth/AuthContext'
import ChatWidget from '../components/ChatWidget'

const drawerWidth = 250

function accountLabel(user) {
  if (!user) return ''
  if (user.role === 'admin') return 'admin'
  if (user.documentType === 'pasaporte') return `Pasaporte ${String(user.document).toUpperCase()}`
  return `DNI ${user.document}`
}

const adminItems = [
  { label: 'Inicio', to: '/admin', icon: <DashboardIcon />, end: true },
  { label: 'Materias', to: '/admin/materias', icon: <MenuBookIcon /> },
  { label: 'Mesas', to: '/admin/mesas', icon: <EventIcon /> },
  { label: 'Notas', to: '/admin/notas', icon: <GradeIcon /> },
  { label: 'Avisos', to: '/admin/avisos', icon: <CampaignIcon /> },
  { label: 'Envíos', to: '/admin/envios', icon: <EmailIcon /> },
]

const studentItems = [
  { label: 'Inicio', to: '/alumno', icon: <SchoolIcon />, end: true },
  { label: 'Notas', to: '/alumno/notas', icon: <GradeIcon /> },
  { label: 'Mesas', to: '/alumno/mesas', icon: <EventIcon /> },
  { label: 'Avisos', to: '/alumno/avisos', icon: <CampaignIcon /> },
  { label: 'Preferencias', to: '/alumno/preferencias', icon: <SettingsIcon /> },
]

export default function AppShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const mobile = useMediaQuery(theme.breakpoints.down('md'))
  const [open, setOpen] = useState(false)
  const items = user?.role === 'admin' ? adminItems : studentItems

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ px: 2, py: 2.5 }}>
        <Typography variant="h6" fontWeight={800} color="primary">Tomi-Alert</Typography>
        <Typography variant="body2" color="text.secondary">Avisos académicos</Typography>
      </Box>
      <Divider />
      <List sx={{ px: 1, flex: 1 }}>
        {items.map((item) => {
          const selected = item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
          return (
            <ListItemButton
              key={item.to}
              selected={selected}
              onClick={() => { navigate(item.to); setOpen(false) }}
              sx={{ borderRadius: 2, mb: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          )
        })}
      </List>
      <Divider />
      <Box sx={{ p: 2, display: 'flex', gap: 1.5, alignItems: 'center' }}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>{user?.name?.[0]}</Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="body2" fontWeight={700} noWrap>{user?.name}</Typography>
          <Typography variant="caption" color="text.secondary" noWrap>{user?.role === 'admin' ? 'Administración' : `Legajo ${user?.legajo}`}</Typography>
        </Box>
        <IconButton aria-label="Cerrar sesión" onClick={() => { logout(); navigate('/login') }}>
          <LogoutIcon />
        </IconButton>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="fixed" elevation={0} color="inherit" sx={{ borderBottom: '1px solid', borderColor: 'divider', zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar>
          {mobile && (
            <IconButton edge="start" onClick={() => setOpen(true)} sx={{ mr: 1 }} aria-label="Abrir menú">
              <MenuIcon />
            </IconButton>
          )}
          <Typography fontWeight={800} color="primary" sx={{ flex: 1 }}>Tomi-Alert</Typography>
          <Typography variant="body2" color="text.secondary">{accountLabel(user)}</Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant={mobile ? 'temporary' : 'permanent'}
        open={mobile ? open : true}
        onClose={() => setOpen(false)}
        sx={{ width: drawerWidth, flexShrink: 0, [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' } }}
      >
        <Toolbar />
        {drawer}
      </Drawer>
      <Box component="main" sx={{ flex: 1, p: { xs: 2, md: 4 }, mt: 8, minWidth: 0 }}>
        <Outlet />
      </Box>
      {user?.role === 'alumno' && <ChatWidget />}
    </Box>
  )
}
