// src/lib/supabase/client.js
import { createBrowserClient } from '@supabase/ssr';

// Ensure these environment variables are set in your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Basic validation
if (!supabaseUrl) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL");
}
if (!supabaseAnonKey) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

// Export the singleton instance of the client
// We use createBrowserClient for client-side usage
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);