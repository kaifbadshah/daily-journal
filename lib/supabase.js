// Import the createClient function from the Supabase library
// Think of this like importing a specific tool from a toolbox
import { createClient } from '@supabase/supabase-js'

// Read the secret values from our .env.local file
// process.env is how JavaScript reads environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create our connection to the database
// We pass our URL (address) and our key (password)
// 'export' means other files in our project can use this connection
export const supabase = createClient(supabaseUrl, supabaseAnonKey)