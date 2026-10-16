import express from 'express'
import cors from 'cors'
import router from './routes/index.js'

export function createApp() {
  const app = express()
  app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }))
  app.use(express.json())
  app.use('/api', router)
  app.use((error, _req, res, _next) => {
    const status = error.status || 500
    if (status >= 500) console.error(error)
    res.status(status).json({ message: error.message || 'Error interno' })
  })
  return app
}
