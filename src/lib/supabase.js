import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = (url && key && url !== 'https://SEU_PROJETO.supabase.co')
  ? createClient(url, key, {
      realtime: { params: { eventsPerSecond: 10 } },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

export const isConfigured = !!supabase

export const IMAGES_BUCKET = 'task-images'
