// src\lib\services\accountService.js

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function getAccounts() {
  const cookieStore = cookies();
  // Ensure you have the createSupabaseServerClient helper correctly defined in @/lib/supabase/server
  const supabase = await createSupabaseServerClient(cookieStore);

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

// Add this function to your existing file
export async function getAccountById(accountId) {
  if (!accountId) {
    return { account: null, error: new Error('Account ID is required') };
  }

  const cookieStore = cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('getAccountById Service: User not authenticated:', userError);
    return { account: null, error: userError || new Error('User not authenticated') };
  }

  const { data: account, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', accountId)
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('getAccountById Service: Error fetching account:', error);
    return { account: null, error };
  }

  return { account, error: null };
}