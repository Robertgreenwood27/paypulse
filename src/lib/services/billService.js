// src/lib/services/billService.js
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function getBills() {
  const cookieStore = cookies();
  const supabase = await createSupabaseServerClient(cookieStore);

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('getBills Service: User not authenticated:', userError);
    return { bills: [], error: userError || new Error('User not authenticated') };
  }

  // RLS filters by user_id, ordering by upcoming due date first
  const { data: bills, error } = await supabase
    .from('bills')
    .select('*')
    .order('due_date', { ascending: true }) // Show nearest due dates first
    .order('name', { ascending: true }); // Then alphabetical

  if (error) {
    console.error('getBills Service: Error fetching bills:', error);
  }

  return { bills: bills || [], error };
}

// Optional: Add getBillById if needed later for an edit page
export async function getBillById(billId) {
    if (!billId) return { bill: null, error: new Error('Bill ID is required.') };

    const cookieStore = cookies();
    const supabase = await createSupabaseServerClient(cookieStore);
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        return { bill: null, error: new Error('User not authenticated') };
    }

    const { data: bill, error } = await supabase
        .from('bills')
        .select('*')
        .eq('id', billId)
        .eq('user_id', user.id) // Explicit user check is good practice
        .single(); // Expect only one result

    if (error && error.code !== 'PGRST116') { // PGRST116 = 'Row not found' which is not a server error
       console.error('getBillById Service: Error fetching bill:', error);
    } else if (!bill) {
        return { bill: null, error: new Error('Bill not found or access denied.') };
    }

    return { bill, error: null }; // Return null error if found or not found gracefully
}