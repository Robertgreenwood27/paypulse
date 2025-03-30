// src/app/(app)/transactions/page.js
import { getTransactions } from '@/lib/services/transactionService';
import { getAccounts } from '@/lib/services/accountService'; // Need accounts for the form dropdown
import TransactionList from '@/components/transactions/TransactionList';
import AddTransactionButton from '@/components/transactions/AddTransactionButton';

export const dynamic = 'force-dynamic';

export default async function TransactionsPage() {
  // Fetch transactions AND accounts server-side
  // Use Promise.all for parallel fetching
  const [transactionsResult, accountsResult] = await Promise.all([
    getTransactions(),
    getAccounts() // Fetch accounts to pass to the AddTransactionButton/Form
  ]);

  const { transactions, error: transactionsError } = transactionsResult;
  const { accounts, error: accountsError } = accountsResult;

  // Combine potential errors for display
  const error = transactionsError || accountsError;

  // Handle authentication errors (middleware should catch first)
  if (error?.message === 'User not authenticated') {
       return (
            <div className="text-center text-red-400 py-10">
                <p>Authentication required.</p>
            </div>
       );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-white">Transactions</h1>
        {/* Pass the fetched accounts to the button/modal */}
        <AddTransactionButton accounts={accounts} />
      </div>

      {error && ( // Display combined errors
        <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded mb-4" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline ml-2"> Failed to load data. ({error.message})</span>
        </div>
      )}

      {/* Display the list (handles empty state internally) */}
      {!error && <TransactionList transactions={transactions} />}

    </div>
  );
}