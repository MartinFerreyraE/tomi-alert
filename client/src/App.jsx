import { Navigate, Route, Routes } from 'react-router-dom'
import { CircularProgress, Box } from '@mui/material'
import { useAuth } from './auth/AuthContext'
import AppShell from './layout/AppShell'
import LoginPage from './pages/LoginPage'
import AdminHome from './pages/admin/AdminHome'
import SubjectsPage from './pages/admin/SubjectsPage'
import ExamsPage from './pages/admin/ExamsPage'
import GradesPage from './pages/admin/GradesPage'
import NoticesPage from './pages/admin/NoticesPage'
import MailLogsPage from './pages/admin/MailLogsPage'
import { StudentHome, StudentGrades, StudentExams, StudentNotices, PreferencesPage } from './pages/student/StudentPages'

function Guard({ role, children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}><CircularProgress /></Box>
  }
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/alumno'} replace />
  return children
}

export default function App() {
  const { user, loading } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={loading ? null : user ? <Navigate to={user.role === 'admin' ? '/admin' : '/alumno'} replace /> : <LoginPage />} />
      <Route path="/admin" element={<Guard role="admin"><AppShell /></Guard>}>
        <Route index element={<AdminHome />} />
        <Route path="materias" element={<SubjectsPage />} />
        <Route path="mesas" element={<ExamsPage />} />
        <Route path="notas" element={<GradesPage />} />
        <Route path="avisos" element={<NoticesPage />} />
        <Route path="envios" element={<MailLogsPage />} />
      </Route>
      <Route path="/alumno" element={<Guard role="alumno"><AppShell /></Guard>}>
        <Route index element={<StudentHome />} />
        <Route path="notas" element={<StudentGrades />} />
        <Route path="mesas" element={<StudentExams />} />
        <Route path="avisos" element={<StudentNotices />} />
        <Route path="preferencias" element={<PreferencesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
