// src/lib/services/creditCardService.js
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

/**
 * Get credit card payment statistics
 * Analyzes payment behavior over the last 6 months
 */
export async function getPaymentStats() {
  const cookieStore = cookies();
  const supabase = createSupabaseServerClient(cookieStore);
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    console.error('getPaymentStats Service: User not authenticated:', userError);
    return { paymentStats: null, error: userError || new Error('User not authenticated') };
  }
  
  try {
    // Get credit card accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('id, name, type, current_balance')
      .eq('user_id', user.id)
      .eq('type', 'credit card');
      
    if (accountsError) throw accountsError;
    
    // If no credit cards, return empty stats
    if (!accounts || accounts.length === 0) {
      return { paymentStats: { averagePaymentRate: 0, minPaymentsOnly: 0, fullPayments: 0 }, error: null };
    }
    
    const creditCardIds = accounts.map(acc => acc.id);
    
    // Set date range for last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const startDate = sixMonthsAgo.toISOString().split('T')[0];
    
    // Get withdrawal transactions (payments to credit cards)
    const { data: payments, error: paymentsError } = await supabase
      .from('transactions')
      .select('*')
      .in('account_id', creditCardIds)
      .eq('type', 'withdrawal')
      .gte('date', startDate)
      .order('date', { ascending: false });
      
    if (paymentsError) throw paymentsError;
    
    // Get bill records associated with credit cards
    const { data: bills, error: billsError } = await supabase
      .from('bills')
      .select('*')
      .in('account_id', creditCardIds)
      .order('due_date', { ascending: false });
      
    if (billsError) throw billsError;
    
    // Calculate statistics based on the data
    let totalPayments = 0;
    let totalStatementAmount = 0;
    let minPaymentsOnly = 0;
    let fullPayments = 0;
    
    // Simple analysis - actual implementation would need more data
    // This is a simplified version that makes some assumptions
    if (payments && payments.length > 0) {
      totalPayments = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
      
      // Track full payments (assume a payment within 5% of statement is a "full payment")
      payments.forEach(payment => {
        // Note: This is simplified - in a real implementation we would match payments to statements
        const bill = bills.find(b => b.account_id === payment.account_id && 
          new Date(b.due_date) >= new Date(payment.date) && 
          new Date(b.due_date) <= new Date(new Date(payment.date).setDate(new Date(payment.date).getDate() + 30)));
          
        if (bill) {
          // Assume bill amount is the statement amount
          totalStatementAmount += Number(bill.amount);
          
          // Check if this was a minimum payment (within 10% of minimum)
          const minPayment = bill.amount * 0.02; // Simplified - assume 2% minimum
          
          if (Math.abs(payment.amount - minPayment) / minPayment < 0.1) {
            minPaymentsOnly++;
          }
          
          // Check if this was a full payment (within 5% of full amount)
          if (Math.abs(payment.amount - bill.amount) / bill.amount < 0.05) {
            fullPayments++;
          }
        }
      });
    }
    
    // Calculate average payment rate
    const averagePaymentRate = totalStatementAmount > 0 
      ? (totalPayments / totalStatementAmount) * 100 
      : 0;
    
    return {
      paymentStats: {
        averagePaymentRate,
        minPaymentsOnly,
        fullPayments
      },
      error: null
    };
    
  } catch (error) {
    console.error('getPaymentStats Service: Error analyzing payments:', error);
    return { paymentStats: null, error };
  }
}