import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),
  JWT_SECRET: z.string().min(8),
  MIKROTIK_API_KEY: z.string(),
  CLICKPESA_API_KEY: z.string(),
  CLICKPESA_CLIENT_ID: z.string(),        // ✅ Required for USSD push
  CLICKPESA_BASE_URL: z.string().url(),   // e.g., https://api.clickpesa.com
  NEXT_PUBLIC_APP_URL: z.string().url(),
  CLICKPESA_WEBHOOK_SECRET: z.string().optional(), // Optional – only if you verify webhooks
})

const env = envSchema.parse(process.env)

export const {
  DATABASE_URL,
  DIRECT_URL,
  JWT_SECRET,
  MIKROTIK_API_KEY,
  CLICKPESA_API_KEY,
  CLICKPESA_CLIENT_ID,
  CLICKPESA_BASE_URL,
  NEXT_PUBLIC_APP_URL,
  CLICKPESA_WEBHOOK_SECRET,
} = env