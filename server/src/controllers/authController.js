import bcrypt from 'bcryptjs'
import { User } from '../models/User.js'
import { signToken, publicUser } from '../middleware/auth.js'
import { asyncHandler, httpError } from '../http.js'

export const login = asyncHandler(async (req, res) => {
  const document = String(req.body.document || '').replace(/\s+/g, '').toLowerCase()
  const password = String(req.body.password || '')
  if (!document || !password) throw httpError(400, 'Completá el DNI o pasaporte y la contraseña.')
  const user = await User.findOne({ document })
  if (!user) throw httpError(401, 'Credenciales inválidas.')
  const ok = await bcrypt.compare(password, user.password)
  if (!ok) throw httpError(401, 'Credenciales inválidas.')
  res.json({ token: signToken(user), user: publicUser(user) })
})

export const me = asyncHandler(async (req, res) => {
  res.json(publicUser(req.user))
})
