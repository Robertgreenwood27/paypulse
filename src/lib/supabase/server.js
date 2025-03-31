// src/lib/supabase/server.js
import { createServerClient } from '@supabase/ssr'; // Add this import
import { cookies } from 'next/headers';

export function createSupabaseServerClient(cookieStore = cookies()) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name) {
        // Keep this synchronous
        const cookie = cookieStore.get(name);
        return cookie?.value;
      },
      set(name, value, options) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch (error) {
          // Handle error when running in middleware
        }
      },
      remove(name, options) {
        try {
          cookieStore.delete({ name, ...options });
        } catch (error) {
          // Handle error when running in middleware
        }
      },
    },
  });
}