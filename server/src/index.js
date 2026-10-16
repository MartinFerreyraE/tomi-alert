import dotenv from 'dotenv'
import cron from 'node-cron'
import { createApp } from './app.js'
import { connectDB } from './config/db.js'
import { runExamReminders } from './jobs/reminders.js'

dotenv.config()

const port = Number(process.env.PORT || 4000)

const app = createApp()

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Tomi-Alert API en http://localhost:${port}`)
    })
    cron.schedule('0 8 * * *', () => {
      runExamReminders().catch((error) => console.error('Recordatorios', error))
    }, { timezone: 'America/Argentina/Buenos_Aires' })
  })
  .catch((error) => {
    console.error('No se pudo conectar a MongoDB', error.message)
    process.exit(1)
  })
