import { getAuditLog } from '@/lib/storage'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get('wallet')
  if (!wallet) return Response.json({ error: 'wallet required' }, { status: 400 })
  try {
    const log = await getAuditLog(wallet)
    return Response.json({ log })
  } catch {
    return Response.json({ log: [] })
  }
}
