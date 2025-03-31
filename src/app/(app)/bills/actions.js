'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getBillById } from '@/lib/services/billService';
import { BILL_FREQUENCIES, BILL_CATEGORIES } from '@/lib/constants/billConstants';

export async function addBill(formData) {
  const cookieStore = cookies();
  const supabase = await createSupabaseServerClient(cookieStore);

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    console.error("Add Bill Action: No session found.", sessionError);
    return { success: false, error: 'Authentication required.' };
  }
  const userId = session.user.id;

  const name = formData.get('name')?.toString();
  const amountStr = formData.get('amount')?.toString();
  const dueDateStr = formData.get('due_date')?.toString();
  const frequency = formData.get('frequency')?.toString();
  const category = formData.get('category')?.toString();
  const auto_pay = formData.get('auto_pay') === 'on';
  const accountId = auto_pay ? (formData.get('account_id')?.toString() || null) : null;

  if (!name || !amountStr || !dueDateStr || !frequency || !category) {
    return { success: false, error: 'Missing required fields (Name, Amount, Due Date, Frequency, Category).' };
  }
  if (!BILL_FREQUENCIES.includes(frequency)) {
    return { success: false, error: 'Invalid frequency selected.' };
  }

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    return { success: false, error: 'Invalid amount. Must be a positive number.' };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDateStr)) {
    return { success: false, error: 'Invalid date format. Use YYYY-MM-DD.' };
  }
  const due_date = dueDateStr;

  const billData = {
    user_id: userId,
    name,
    amount,
    due_date,
    frequency,
    category,
    auto_pay,
    account_id: accountId,
  };

  const { data, error } = await supabase
    .from('bills')
    .insert(billData)
    .select()
    .single();

  if (error) {
    console.error('Error adding bill:', error);
    return { success: false, error: `Database error: ${error.message}` };
  }

  revalidatePath('/bills');
  revalidatePath('/dashboard');

  console.log("Bill added successfully:", data);
  return { success: true, data };
}

export async function deleteBill(billId) {
  if (!billId) {
    return { success: false, error: 'Bill ID is required.' };
  }
  const cookieStore = cookies();
  const supabase = await createSupabaseServerClient(cookieStore);

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    console.error("Delete Bill Action: No session found.", sessionError);
    return { success: false, error: 'Authentication required.' };
  }

  const { error } = await supabase
    .from('bills')
    .delete()
    .eq('id', billId)
    .eq('user_id', session.user.id);

  if (error) {
    console.error('Error deleting bill:', error);
    return { success: false, error: `Database error: ${error.message}` };
  }

  revalidatePath('/bills');
  revalidatePath('/dashboard');
  console.log("Bill deleted successfully:", billId);
  return { success: true };
}

export async function updateBill(billId, formData) {
  if (!billId) {
    return { success: false, error: 'Bill ID is required for update.' };
  }

  const cookieStore = cookies();
  const supabase = await createSupabaseServerClient(cookieStore);

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    console.error("Update Bill Action: No session found.", sessionError);
    return { success: false, error: 'Authentication required.' };
  }
  const userId = session.user.id;

  const { bill: existingBill, error: fetchError } = await getBillById(billId);
  if (fetchError || !existingBill) {
    console.error('Update Bill Action: Failed to fetch existing bill or access denied.', billId, fetchError);
    return { success: false, error: fetchError?.message || 'Bill not found or access denied.' };
  }

  const name = formData.get('name')?.toString();
  const amountStr = formData.get('amount')?.toString();
  const dueDateStr = formData.get('due_date')?.toString();
  const frequency = formData.get('frequency')?.toString();
  const category = formData.get('category')?.toString();
  const auto_pay = formData.get('auto_pay') === 'on';
  const accountId = auto_pay ? (formData.get('account_id')?.toString() || null) : null;

  if (!name || !amountStr || !dueDateStr || !frequency || !category) {
    return { success: false, error: 'Missing required fields (Name, Amount, Due Date, Frequency, Category).' };
  }
  if (!BILL_FREQUENCIES.includes(frequency)) {
    return { success: false, error: 'Invalid frequency selected.' };
  }

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    return { success: false, error: 'Invalid amount. Must be a positive number.' };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDateStr)) {
    return { success: false, error: 'Invalid date format. Use YYYY-MM-DD.' };
  }
  const due_date = dueDateStr;

  const billUpdateData = {
    name,
    amount,
    due_date,
    frequency,
    category,
    auto_pay,
    account_id: accountId,
    updated_at: new Date().toISOString(),
  };

  const { data, error: updateError } = await supabase
    .from('bills')
    .update(billUpdateData)
    .eq('id', billId)
    .eq('user_id', userId)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating bill:', billId, updateError);
    return { success: false, error: `Database error: ${updateError.message}` };
  }

  revalidatePath('/bills');
  revalidatePath('/dashboard');

  console.log("Bill updated successfully:", data);
  return { success: true, data };
}