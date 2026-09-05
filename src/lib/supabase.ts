import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

const nodeEnv =
  typeof globalThis !== 'undefined' && 'process' in globalThis
    ? (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
    : undefined

const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  nodeEnv?.VITE_SUPABASE_URL

const supabaseAnonKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  nodeEnv?.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables.')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

