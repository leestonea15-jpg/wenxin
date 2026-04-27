import { useMemo } from 'react'
import { supabase } from '../services/supabase'

export const useSupabase = () => {
  return useMemo(() => ({ supabase }), [])
}
