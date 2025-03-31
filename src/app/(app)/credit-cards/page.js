// src/app/(app)/credit-cards/page.js
import { getAccounts } from '@/lib/services/accountService';
import { getTransactions } from '@/lib/services/transactionService';
import Link from 'next/link';
import AddAccountButton from '@/components/accounts/AddAccountButton';
import CreditCardList from '@/components/credit-cards/CreditCardList';
import CreditCardSummary from '@/components/credit-cards/CreditCardSummary';
import { getPaymentStats } from '@/lib/services/creditCardService';

export const dynamic = 'force-dynamic';

export default async function CreditCardsPage() {
  // Fetch accounts and filter for credit cards only
  const { accounts, error: accountsError } = await getAccounts();
  const creditCards = accounts.filter(account => account.type === 'credit card');
  
  // Fetch recent payment transactions for analysis
  const last6Months = new Date();
  last6Months.setMonth(last6Months.getMonth() - 6);
  const dateFilter = last6Months.toISOString().split('T')[0];
  
  // Fetch recent transactions
  const { transactions, error: transactionsError } = await getTransactions(null);
  
  // Fetch payment stats
  const { paymentStats, error: statsError } = await getPaymentStats();
  
  // Combine errors
  const error = accountsError || transactionsError || statsError;

  // Handle case where user is not authenticated
  if (error?.message === 'User not authenticated') {
       return (
            <div className="text-center text-red-400 py-10">
                <p>Authentication required to view credit cards.</p>
            </div>
       );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-white">Credit Cards</h1>
        {/* Pass credit card as preselected type */}
        <AddAccountButton defaultType="credit card" />
      </div>

      {error && (
        <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded mb-4" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline ml-2"> Failed to load credit card data. ({error.message})</span>
        </div>
      )}

      {/* Summary statistics */}
      {!error && creditCards.length > 0 && (
        <CreditCardSummary creditCards={creditCards} paymentStats={paymentStats} />
      )}

      {/* Display the list (handles empty state internally) */}
      {!error && <CreditCardList creditCards={creditCards} />}

      {/* Help text if no credit cards */}
      {!error && creditCards.length === 0 && (
        <div className="mt-8 text-center">
          <p className="text-gray-400">You don't have any credit card accounts set up yet.</p>
          <p className="text-gray-400 mt-2">
            To add a credit card, click "Add Account" and select "credit card" as the account type.
          </p>
        </div>
      )}

      {/* Suggestions section */}
      {!error && creditCards.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold text-white mb-4">Tips for Managing Credit Card Debt</h2>
          
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <ul className="space-y-2 text-gray-300">
              <li>• Pay more than the minimum payment whenever possible to reduce interest charges.</li>
              <li>• Focus on paying down the highest interest rate cards first (debt avalanche method).</li>
              <li>• Keep your credit utilization below 30% to maintain a good credit score.</li>
              <li>• Consider balance transfer options for high-interest cards.</li>
              <li>• Create a payment strategy using the <Link href="/debt-payoff" className="text-accent-green hover:underline">Debt Payoff Calculator</Link>.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}