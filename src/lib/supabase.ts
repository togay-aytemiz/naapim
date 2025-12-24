import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
        'Supabase environment variables are not set. Please create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
    )
}

export const supabase = createClient(
    supabaseUrl || '',
    supabaseAnonKey || ''
)

export const SUPABASE_FUNCTIONS_URL = `${supabaseUrl}/functions/v1`
export const SUPABASE_ANON_KEY = supabaseAnonKey || ''


