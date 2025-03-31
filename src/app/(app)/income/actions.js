'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getIncomeSourceById } from '@/lib/services/incomeService';
import { INCOME_FREQUENCIES } from '@/lib/constants/incomeConstants';

export async function addIncomeSource(formData) {
  const cookieStore = cookies();
  const supabase = await createSupabaseServerClient(cookieStore);

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    console.error("Add Income Action: No session found.", sessionError);
    return { success: false, error: 'Authentication required.' };
  }
  const userId = session.user.id;

  const source = formData.get('source')?.toString();
  const amountStr = formData.get('amount')?.toString();
  const frequency = formData.get('frequency')?.toString();
  const nextDateStr = formData.get('next_date')?.toString() || null;

  if (!source || !amountStr || !frequency) {
    return { success: false, error: 'Missing required fields (Source, Amount, Frequency).' };
  }
  if (!INCOME_FREQUENCIES.includes(frequency)) {
    return { success: false, error: 'Invalid frequency selected.' };
  }

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    return { success: false, error: 'Invalid amount. Must be a positive number.' };
  }

  let next_date = null;
  if (frequency !== 'once') {
    if (!nextDateStr) {
      return { success: false, error: 'Next Date is required for recurring income.' };
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(nextDateStr)) {
      return { success: false, error: 'Invalid date format. Use YYYY-MM-DD.' };
    }
    next_date = nextDateStr;
  } else if (nextDateStr) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(nextDateStr)) {
      return { success: false, error: 'Invalid date format. Use YYYY-MM-DD.' };
    }
    next_date = nextDateStr;
  }

  const incomeData = {
    user_id: userId,
    source,
    amount,
    frequency,
    next_date,
  };

  const { data, error } = await supabase
    .from('income')
    .insert(incomeData)
    .select()
    .single();

  if (error) {
    console.error('Error adding income source:', error);
    return { success: false, error: `Database error: ${error.message}` };
  }

  revalidatePath('/income');
  revalidatePath('/dashboard');

  console.log("Income source added successfully:", data);
  return { success: true, data };
}

export async function deleteIncomeSource(incomeId) {
  if (!incomeId) {
    return { success: false, error: 'Income ID is required.' };
  }
  const cookieStore = cookies();
  const supabase = await createSupabaseServerClient(cookieStore);

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    console.error("Delete Income Action: No session found.", sessionError);
    return { success: false, error: 'Authentication required.' };
  }

  const { error } = await supabase
    .from('income')
    .delete()
    .eq('id', incomeId)
    .eq('user_id', session.user.id);

  if (error) {
    console.error('Error deleting income source:', error);
    return { success: false, error: `Database error: ${error.message}` };
  }

  revalidatePath('/income');
  revalidatePath('/dashboard');
  console.log("Income source deleted successfully:", incomeId);
  return { success: true };
}

export async function updateIncomeSource(incomeId, formData) {
  if (!incomeId) {
    return { success: false, error: 'Income Source ID is required for update.' };
  }

  const cookieStore = cookies();
  const supabase = await createSupabaseServerClient(cookieStore);

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    console.error("Update Income Action: No session found.", sessionError);
    return { success: false, error: 'Authentication required.' };
  }
  const userId = session.user.id;

  const { incomeSource: existingIncome, error: fetchError } = await getIncomeSourceById(incomeId);
  if (fetchError || !existingIncome) {
    console.error('Update Income Action: Failed to fetch existing income source or access denied.', incomeId, fetchError);
    return { success: false, error: fetchError?.message || 'Income source not found or access denied.' };
  }

  const source = formData.get('source')?.toString();
  const amountStr = formData.get('amount')?.toString();
  const frequency = formData.get('frequency')?.toString();
  const nextDateStr = formData.get('next_date')?.toString() || null;

  if (!source || !amountStr || !frequency) {
    return { success: false, error: 'Missing required fields (Source, Amount, Frequency).' };
  }
  if (!INCOME_FREQUENCIES.includes(frequency)) {
    return { success: false, error: 'Invalid frequency selected.' };
  }

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    return { success: false, error: 'Invalid amount. Must be a positive number.' };
  }

  let next_date = null;
  if (frequency !== 'once') {
    if (!nextDateStr) {
      return { success: false, error: 'Next Date is required for recurring income.' };
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(nextDateStr)) {
      return { success: false, error: 'Invalid date format. Use YYYY-MM-DD.' };
    }
    next_date = nextDateStr;
  } else if (nextDateStr) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(nextDateStr)) {
      return { success: false, error: 'Invalid date format for optional date. Use YYYY-MM-DD.' };
    }
    next_date = nextDateStr;
  }

  const incomeUpdateData = {
    source,
    amount,
    frequency,
    next_date,
    updated_at: new Date().toISOString(),
  };

  const { data, error: updateError } = await supabase
    .from('income')
    .update(incomeUpdateData)
    .eq('id', incomeId)
    .eq('user_id', userId)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating income source:', incomeId, updateError);
    return { success: false, error: `Database error: ${updateError.message}` };
  }

  revalidatePath('/income');
  revalidatePath('/dashboard');

  console.log("Income source updated successfully:", data);
  return { success: true, data };
}