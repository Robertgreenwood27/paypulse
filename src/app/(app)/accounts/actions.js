// src/app/(app)/accounts/actions.js
// Updated to handle credit card specific fields
'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getAccountById } from '@/lib/services/accountService';

export async function addAccount(formData) {
  const cookieStore = cookies();
  const supabase = await createSupabaseServerClient(cookieStore);

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    console.error("Add Account Action: No session found.", sessionError);
    return { success: false, error: 'Authentication required.' };
  }
  const userId = session.user.id;

  const name = formData.get('name')?.toString();
  const type = formData.get('type')?.toString();
  const identifier = formData.get('identifier')?.toString() || null;
  const balanceStr = formData.get('current_balance')?.toString();

  if (!name || !type || !balanceStr) {
    return { success: false, error: 'Missing required fields (Name, Type, Balance).' };
  }
  const current_balance = parseFloat(balanceStr);
  if (isNaN(current_balance)) {
      return { success: false, error: 'Invalid balance amount.' };
  }

  // Basic account data
  const accountData = { 
    user_id: userId, 
    name, 
    type, 
    identifier, 
    current_balance 
  };

  // Add credit card specific fields if account type is credit card
  if (type === 'credit card') {
    const creditLimitStr = formData.get('credit_limit')?.toString();
    const aprStr = formData.get('apr')?.toString();
    
    if (!creditLimitStr || !aprStr) {
      return { success: false, error: 'Credit cards require Credit Limit and APR fields.' };
    }
    
    const credit_limit = parseFloat(creditLimitStr);
    const apr = parseFloat(aprStr);
    
    if (isNaN(credit_limit) || credit_limit <= 0) {
      return { success: false, error: 'Credit limit must be a positive number.' };
    }
    
    if (isNaN(apr) || apr < 0) {
      return { success: false, error: 'APR must be a non-negative number.' };
    }
    
    // Add credit card fields to accountData
    accountData.credit_limit = credit_limit;
    accountData.apr = apr;
    
    // Optional minimum payment fields
    const minPaymentPercentStr = formData.get('min_payment_percent')?.toString();
    const minPaymentFixedStr = formData.get('min_payment_fixed')?.toString();
    
    if (minPaymentPercentStr) {
      const min_payment_percent = parseFloat(minPaymentPercentStr);
      if (!isNaN(min_payment_percent) && min_payment_percent > 0 && min_payment_percent <= 100) {
        accountData.min_payment_percent = min_payment_percent;
      }
    }
    
    if (minPaymentFixedStr) {
      const min_payment_fixed = parseFloat(minPaymentFixedStr);
      if (!isNaN(min_payment_fixed) && min_payment_fixed > 0) {
        accountData.min_payment_fixed = min_payment_fixed;
      }
    }
  }

  const { data, error } = await supabase
    .from('accounts')
    .insert(accountData)
    .select()
    .single();

  if (error) {
    console.error('Error adding account:', error);
    return { success: false, error: `Database error: ${error.message}` };
  }

  revalidatePath('/accounts');
  revalidatePath('/dashboard');
  revalidatePath('/credit-cards');  // Add this path for the new credit card dashboard

  console.log("Account added successfully:", data);
  return { success: true, data };
}

export async function updateAccount(accountId, formData) {
    if (!accountId) {
        return { success: false, error: 'Account ID is required for update.' };
    }

    const cookieStore = cookies();
    const supabase = await createSupabaseServerClient(cookieStore);

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
        console.error("Update Account Action: No session found.", sessionError);
        return { success: false, error: 'Authentication required.' };
    }
    const userId = session.user.id;

    const { account: existingAccount, error: fetchError } = await getAccountById(accountId);
    if (fetchError || !existingAccount) {
        console.error('Update Account Action: Failed to fetch existing account or access denied.', accountId, fetchError);
        return { success: false, error: fetchError?.message || 'Account not found or access denied.' };
    }

    const name = formData.get('name')?.toString();
    const type = formData.get('type')?.toString();
    const identifier = formData.get('identifier')?.toString() || null;
    const balanceStr = formData.get('current_balance')?.toString();

    if (!name || !type || !balanceStr) {
        return { success: false, error: 'Missing required fields (Name, Type, Balance).' };
    }

    const current_balance = parseFloat(balanceStr);
    if (isNaN(current_balance)) {
        return { success: false, error: 'Invalid balance amount.' };
    }

    const accountUpdateData = {
        name,
        type,
        identifier,
        current_balance,
        updated_at: new Date().toISOString(),
    };

    // Handle credit card specific fields
    if (type === 'credit card') {
        const creditLimitStr = formData.get('credit_limit')?.toString();
        const aprStr = formData.get('apr')?.toString();
        
        if (!creditLimitStr || !aprStr) {
            return { success: false, error: 'Credit cards require Credit Limit and APR fields.' };
        }
        
        const credit_limit = parseFloat(creditLimitStr);
        const apr = parseFloat(aprStr);
        
        if (isNaN(credit_limit) || credit_limit <= 0) {
            return { success: false, error: 'Credit limit must be a positive number.' };
        }
        
        if (isNaN(apr) || apr < 0) {
            return { success: false, error: 'APR must be a non-negative number.' };
        }
        
        // Add credit card fields to accountUpdateData
        accountUpdateData.credit_limit = credit_limit;
        accountUpdateData.apr = apr;
        
        // Optional minimum payment fields
        const minPaymentPercentStr = formData.get('min_payment_percent')?.toString();
        const minPaymentFixedStr = formData.get('min_payment_fixed')?.toString();
        
        if (minPaymentPercentStr) {
            const min_payment_percent = parseFloat(minPaymentPercentStr);
            if (!isNaN(min_payment_percent) && min_payment_percent > 0 && min_payment_percent <= 100) {
                accountUpdateData.min_payment_percent = min_payment_percent;
            } else if (minPaymentPercentStr === '') {
                // Handle clearing the field
                accountUpdateData.min_payment_percent = null;
            }
        }
        
        if (minPaymentFixedStr) {
            const min_payment_fixed = parseFloat(minPaymentFixedStr);
            if (!isNaN(min_payment_fixed) && min_payment_fixed > 0) {
                accountUpdateData.min_payment_fixed = min_payment_fixed;
            } else if (minPaymentFixedStr === '') {
                // Handle clearing the field
                accountUpdateData.min_payment_fixed = null;
            }
        }
    } else {
        // If changing from credit card to another type, clear credit card fields
        accountUpdateData.credit_limit = null;
        accountUpdateData.apr = null;
        accountUpdateData.min_payment_percent = null;
        accountUpdateData.min_payment_fixed = null;
    }

    const { data, error: updateError } = await supabase
        .from('accounts')
        .update(accountUpdateData)
        .eq('id', accountId)
        .eq('user_id', userId)
        .select()
        .single();

    if (updateError) {
        console.error('Error updating account:', accountId, updateError);
        return { success: false, error: `Database error: ${updateError.message}` };
    }

    if (existingAccount.current_balance !== current_balance) {
        const { error: historyError } = await supabase
            .from('balance_history')
            .insert({
                account_id: accountId,
                balance: current_balance,
                date: accountUpdateData.updated_at.split('T')[0],
            });
        if (historyError) {
            console.warn(`Update Account Action: Account ${accountId} updated, but failed to log balance history:`, historyError.message);
        } else {
            console.log(`Update Account Action: Logged balance history for manual update on account ${accountId}`);
        }
    }

    revalidatePath('/accounts');
    revalidatePath('/dashboard');
    revalidatePath('/credit-cards');  // Add this path for the new credit card dashboard

    console.log("Account updated successfully:", data);
    return { success: true, data };
}

export async function deleteAccount(accountId) {
   if (!accountId) {
       return { success: false, error: 'Account ID is required.' };
   }
   const cookieStore = cookies();
   const supabase = await createSupabaseServerClient(cookieStore);

   const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
        console.error("Delete Account Action: No session found.", sessionError);
        return { success: false, error: 'Authentication required.' };
    }

   const { error } = await supabase
       .from('accounts')
       .delete()
       .eq('id', accountId)
       .eq('user_id', session.user.id);

    if (error) {
        console.error('Error deleting account:', error);
        return { success: false, error: `Database error: ${error.message}` };
    }

    revalidatePath('/accounts');
    revalidatePath('/dashboard');
    revalidatePath('/credit-cards');  // Add this path for the new credit card dashboard

    console.log("Account deleted successfully:", accountId);
    return { success: true };
}