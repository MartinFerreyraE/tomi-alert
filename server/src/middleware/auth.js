import jwt from 'jsonwebtoken'
import { User } from '../models/User.js'

export function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: '12h' })
}

export function publicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    document: user.document,
    documentType: user.documentType || '',
    email: user.email,
    role: user.role,
    legajo: user.legajo || '',
  }
}

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) return res.status(401).json({ message: 'Tenés que iniciar sesión.' })
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(payload.sub)
    if (!user) return res.status(401).json({ message: 'Sesión inválida.' })
    req.user = user
    next()
  } catch {
    return res.status(401).json({ message: 'Sesión inválida.' })
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'No tenés permiso para esta acción.' })
    }
    next()
  }
}
