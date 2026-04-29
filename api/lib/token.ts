import { createHmac } from 'crypto'

export function makeToken(appointmentId: string): string {
  return createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY!)
    .update(appointmentId)
    .digest('base64url')
}
