import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../utils/constants'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export type User = Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user']
export type Session = Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']
