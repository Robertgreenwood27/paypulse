// src/lib/services/accountService.js
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function getAccounts() {
  const cookieStore = cookies();
  // Ensure you have the createSupabaseServerClient helper correctly defined in @/lib/supabase/server
  const supabase = createSupabaseServerClient(cookieStore);

  // Validate user session first is good practice
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('getAccounts Service: Error fetching user or user not found:', userError);
    // Redirecting might happen in middleware, here return indicates failure
    return { accounts: [], error: userError || new Error('User not authenticated') };
  }

  // RLS enforces user_id filter automatically
  const { data: accounts, error } = await supabase
    .from('accounts')
    .select('*')
    .order('name', { ascending: true }); // Order by name might be nicer

  if (error) {
    console.error('getAccounts Service: Error fetching accounts:', error);
    // Return error for page to handle
  }

  return { accounts: accounts || [], error };
}