import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { login, me } from '../controllers/authController.js'
import {
  listCareers, listSubjects, updateSubject,
  listEnrollments, createEnrollment, updateEnrollment, listStudents,
  listExams, createExam, updateExam, deleteExam,
  listGrades, createGrade, stats,
} from '../controllers/academicController.js'
import { listNotices, createNotice, resendNotice } from '../controllers/noticeController.js'
import { getMine, updateMine } from '../controllers/preferenceController.js'
import { listMessages, postMessage, markRead } from '../controllers/chatController.js'
import { listMailLogs, runReminders } from '../controllers/opsController.js'

const router = Router()
const admin = [requireAuth, requireRole('admin')]
const alumno = [requireAuth, requireRole('alumno')]

router.get('/health', (_req, res) => res.json({ ok: true, service: 'tomi-alert' }))
router.post('/auth/login', login)
router.get('/auth/me', requireAuth, me)

router.get('/careers', requireAuth, listCareers)
router.get('/subjects', requireAuth, listSubjects)
router.put('/subjects/:id', ...admin, updateSubject)

router.get('/enrollments', requireAuth, listEnrollments)
router.post('/enrollments', ...admin, createEnrollment)
router.patch('/enrollments/:id', ...admin, updateEnrollment)
router.get('/students', ...admin, listStudents)

router.get('/exams', requireAuth, listExams)
router.post('/exams', ...admin, createExam)
router.put('/exams/:id', ...admin, updateExam)
router.delete('/exams/:id', ...admin, deleteExam)

router.get('/grades', requireAuth, listGrades)
router.post('/grades', ...admin, createGrade)
router.get('/stats', ...admin, stats)

router.get('/notices', requireAuth, listNotices)
router.post('/notices', ...admin, createNotice)
router.post('/notices/:id/resend', ...admin, resendNotice)

router.get('/preferences', ...alumno, getMine)
router.put('/preferences', ...alumno, updateMine)

router.get('/chat', ...alumno, listMessages)
router.post('/chat', ...alumno, postMessage)
router.post('/chat/read', ...alumno, markRead)

router.get('/mail-logs', ...admin, listMailLogs)
router.post('/reminders/run', ...admin, runReminders)

export default router
