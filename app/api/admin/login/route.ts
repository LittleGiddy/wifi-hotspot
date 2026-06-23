import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { JWT_SECRET } from '@/lib/env'

// Pre‑hashed password – you can store in DB or use a constant
const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD_HASH = bcrypt.hashSync('your-secure-password', 10)

export async function POST(req: Request) {
  const { username, password } = await req.json()

  if (username !== ADMIN_USERNAME) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const valid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '1d' })
  const response = NextResponse.json({ success: true })
  response.cookies.set('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 86400,
  })
  return response
}