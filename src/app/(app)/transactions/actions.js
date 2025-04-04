'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { TRANSACTION_TYPES, TRANSACTION_CATEGORIES } from '@/lib/constants/transactionConstants';

// Updated helper function to include balance history logging
async function updateAccountBalance(supabase, accountId, userId, adjustment) {
    const { data: account, error: fetchError } = await supabase
        .from('accounts')
        .select('current_balance')
        .eq('id', accountId)
        .eq('user_id', userId)
        .single();

    if (fetchError || !account) {
        console.error('Balance Update: Failed to fetch account', accountId, fetchError);
        return false;
    }

    const currentBalance = parseFloat(account.current_balance) || 0;
    const newBalance = currentBalance + parseFloat(adjustment);

    if (isNaN(newBalance)) {
        console.error('Balance Update: Invalid new balance calculation', accountId, adjustment);
        return false;
    }

    const updateTimestamp = new Date().toISOString();
    const { error: updateError } = await supabase
        .from('accounts')
        .update({ current_balance: newBalance, updated_at: updateTimestamp })
        .eq('id', accountId)
        .eq('user_id', userId);

    if (updateError) {
        console.error('Balance Update: Failed to update balance for account', accountId, updateError);
        return false;
    }

    const { error: historyError } = await supabase
        .from('balance_history')
        .insert({
            account_id: accountId,
            balance: newBalance,
            date: updateTimestamp.split('T')[0],
        });

    if (historyError) {
        console.warn(`Balance Update: Successfully updated account ${accountId}, but failed to log balance history:`, historyError.message);
    } else {
        console.log(`Balance History: Logged balance ${newBalance} for account ${accountId}`);
    }

    console.log(`Balance Update: Account ${accountId} updated to ${newBalance}`);
    return true;
}

export async function addTransaction(formData) {
  const cookieStore = cookies();
  const supabase = await createSupabaseServerClient(cookieStore);

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    return { success: false, error: 'Authentication required.' };
  }
  const userId = session.user.id;

  const account_id = formData.get('account_id')?.toString();
  const type = formData.get('type')?.toString();
  const amountStr = formData.get('amount')?.toString();
  const dateStr = formData.get('date')?.toString();
  const description = formData.get('description')?.toString() || null;
  const category = formData.get('category')?.toString() || null;
  const bill_id = formData.get('bill_id')?.toString() || null;
  const payment_to_account_id = formData.get('payment_to_account_id')?.toString() || null;
  const is_minimum_payment = formData.get('is_minimum_payment')?.toString() === 'true';

  if (!account_id || !type || !amountStr || !dateStr) {
    return { success: false, error: 'Missing required fields (Account, Type, Amount, Date).' };
  }
  if (!TRANSACTION_TYPES.includes(type)) {
     return { success: false, error: 'Invalid transaction type.' };
  }

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
      return { success: false, error: 'Invalid amount. Must be a positive number.' };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
       return { success: false, error: 'Invalid date format. Use YYYY-MM-DD.' };
  }
  const date = dateStr;

  let balanceAdjustment = 0;
  if (type === 'deposit') {
      balanceAdjustment = amount;
  } else if (type === 'withdrawal' || type === 'transfer') {
      balanceAdjustment = -amount;
  }

  const transactionData = {
    user_id: userId,
    account_id,
    type,
    amount,
    date,
    description,
    category,
    ...(bill_id && { bill_id }),
    ...(payment_to_account_id && { payment_to_account_id }),
    ...(is_minimum_payment !== undefined && { is_minimum_payment }),
  };

  const { data, error } = await supabase
    .from('transactions')
    .insert(transactionData)
    .select()
    .single();

  if (error) {
    console.error('Error adding transaction:', error);
    return { success: false, error: `Database error: ${error.message}` };
  }

  // Update the source account balance
  const balanceUpdated = await updateAccountBalance(supabase, account_id, userId, balanceAdjustment);
  if (!balanceUpdated) {
       console.warn(`Transaction ${data.id} added, but failed to update balance for account ${account_id}`);
  }

  // If this is a credit card payment, also update the credit card account balance
  if (payment_to_account_id) {
    // Credit card payments are withdrawals from one account that increase the available credit on the card
    // For the credit card, this means reducing the balance (the amount owed)
    const creditCardBalanceUpdated = await updateAccountBalance(supabase, payment_to_account_id, userId, -amount);
    if (!creditCardBalanceUpdated) {
      console.warn(`Credit card payment recorded, but failed to update balance for card ${payment_to_account_id}`);
    }
  }

  revalidatePath('/transactions');
  revalidatePath('/dashboard');
  revalidatePath(`/accounts`);
  revalidatePath('/credit-cards'); // Add this path for the new credit card dashboard

  console.log("Transaction added successfully:", data);
  return { success: true, data };
}

export async function deleteTransaction(transactionId) {
   if (!transactionId) {
       return { success: false, error: 'Transaction ID is required.' };
   }
   const cookieStore = cookies();
   const supabase = await createSupabaseServerClient(cookieStore);

   const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
        return { success: false, error: 'Authentication required.' };
    }
    const userId = session.user.id;

    const { data: transaction, error: fetchError } = await supabase
        .from('transactions')
        .select('account_id, type, amount, payment_to_account_id')
        .eq('id', transactionId)
        .eq('user_id', userId)
        .single();

    if (fetchError || !transaction) {
        console.error('Delete Transaction: Failed to fetch transaction details', transactionId, fetchError);
        return { success: false, error: fetchError?.message || 'Transaction not found or access denied.' };
    }

    const { error: deleteError } = await supabase
       .from('transactions')
       .delete()
       .eq('id', transactionId)
       .eq('user_id', userId);

    if (deleteError) {
        console.error('Error deleting transaction:', deleteError);
        return { success: false, error: `Database error: ${deleteError.message}` };
    }

    const { account_id, type, amount, payment_to_account_id } = transaction;
    
    // Calculate balance adjustment for the source account
    let balanceAdjustment = 0;
    if (type === 'deposit') {
        balanceAdjustment = -parseFloat(amount);
    } else if (type === 'withdrawal' || type === 'transfer') {
        balanceAdjustment = parseFloat(amount);
    }

    // Update the source account balance
    const balanceUpdated = await updateAccountBalance(supabase, account_id, userId, balanceAdjustment);
     if (!balanceUpdated) {
         console.warn(`Transaction ${transactionId} deleted, but failed to update balance for account ${account_id}`);
     }
     
    // If this was a credit card payment, also update the credit card account balance
    if (payment_to_account_id) {
      // We're reversing a payment, so we need to increase the credit card balance (add the amount owed back)
      const creditCardBalanceUpdated = await updateAccountBalance(supabase, payment_to_account_id, userId, parseFloat(amount));
      if (!creditCardBalanceUpdated) {
        console.warn(`Credit card payment deleted, but failed to update balance for card ${payment_to_account_id}`);
      }
    }

    revalidatePath('/transactions');
    revalidatePath('/dashboard');
    revalidatePath(`/accounts`);
    revalidatePath('/credit-cards'); // Add this path for the new credit card dashboard

    console.log("Transaction deleted successfully:", transactionId);
    return { success: true };
}

export async function updateTransaction(transactionId, formData) {
     console.log("Update action called for transaction:", transactionId);
     revalidatePath('/transactions');
     revalidatePath('/dashboard');
     revalidatePath(`/accounts`);
     revalidatePath('/credit-cards'); // Add this path for the new credit card dashboard
     return { success: true, message: 'Transaction update not fully implemented yet.' };
}