// src/lib/services/incomeService.js
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function getIncomeSources() {
  const cookieStore = cookies();
  const supabase = await createSupabaseServerClient(cookieStore);

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('getIncomeSources Service: User not authenticated:', userError);
    return { incomeSources: [], error: userError || new Error('User not authenticated') };
  }

  // RLS filters by user_id
  const { data: incomeSources, error } = await supabase
    .from('income')
    .select('*')
    .order('next_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getIncomeSources Service: Error fetching income:', error);
  }

  return { incomeSources: incomeSources || [], error };
}

// --- Function to get a single income source by ID ---
export async function getIncomeSourceById(incomeId) {
  if (!incomeId) {
    return { incomeSource: null, error: new Error('Income Source ID is required.') };
  }

  const cookieStore = cookies();
  const supabase = await createSupabaseServerClient(cookieStore);
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { incomeSource: null, error: new Error('User not authenticated') };
  }

  const { data: incomeSource, error } = await supabase
    .from('income')
    .select('*')
    .eq('id', incomeId)
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('getIncomeSourceById Service: Error fetching income source:', error);
    return { incomeSource: null, error };
  } else if (!incomeSource) {
    return { incomeSource: null, error: new Error('Income source not found or access denied.') };
  }

  return { incomeSource, error: null };
}