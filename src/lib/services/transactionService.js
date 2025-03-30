// src/lib/services/transactionService.js
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// Fetches all transactions for the logged-in user, optionally filtered by accountId
export async function getTransactions(accountId = null) {
  const cookieStore = cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('getTransactions Service: User not authenticated:', userError);
    return { transactions: [], error: userError || new Error('User not authenticated') };
  }

  let query = supabase
    .from('transactions')
    // Select transaction details AND related account name for display
    .select(`
        *,
        accounts ( name, type )
      `)
    .eq('user_id', user.id) // Ensure user owns the transaction (RLS backup)
    .order('date', { ascending: false }) // Show most recent first
    .order('created_at', { ascending: false }); // Secondary sort by creation time

  // Optional filtering by account ID
  if (accountId) {
    query = query.eq('account_id', accountId);
  }

  const { data: transactions, error } = await query;

  if (error) {
    console.error('getTransactions Service: Error fetching transactions:', error);
  }

  return { transactions: transactions || [], error };
}

// Optional: getTransactionById for editing later
export async function getTransactionById(transactionId) {
     if (!transactionId) return { transaction: null, error: new Error('Transaction ID required.') };

     const cookieStore = cookies();
     const supabase = createSupabaseServerClient(cookieStore);
     const { data: { user }, error: userError } = await supabase.auth.getUser();

     if (userError || !user) return { transaction: null, error: new Error('User not authenticated') };

     const { data: transaction, error } = await supabase
         .from('transactions')
         .select('*, accounts ( name, type )') // Also fetch account details
         .eq('id', transactionId)
         .eq('user_id', user.id)
         .single();

     if (error && error.code !== 'PGRST116') { // Ignore 'Row not found'
        console.error('getTransactionById Service: Error fetching transaction:', error);
        return { transaction: null, error };
     } else if (!transaction) {
         return { transaction: null, error: new Error('Transaction not found or access denied.') };
     }

     return { transaction, error: null };
}