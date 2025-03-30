// src/app/(app)/accounts/page.js
import { getAccounts } from '@/lib/services/accountService';
// Removed Button import, it's inside AddAccountButton now
import AccountList from '@/components/accounts/AccountList'; // Check this path carefully
import AddAccountButton from '@/components/accounts/AddAccountButton'; // Check this path carefully

// Using force-dynamic might be unnecessary if revalidatePath works reliably,
// but it ensures data freshness on navigation. Keep for now or test without.
export const dynamic = 'force-dynamic';

export default async function AccountsPage() {
  // Fetch accounts server-side
  const { accounts, error } = await getAccounts();

  // Handle case where user is not authenticated (service function should indicate this)
  if (error?.message === 'User not authenticated') {
       // Middleware should have redirected, but as a fallback:
       // redirect('/login?message=Authentication required');
       // Or display an error message on this page if preferred
       return (
            <div className="text-center text-red-400 py-10">
                <p>Authentication required to view accounts.</p>
            </div>
       );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-white">Accounts</h1>
        {/* Client component that handles modal logic */}
        <AddAccountButton />
      </div>

      {error && ( // Display other potential errors (like DB connection issues)
        <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded mb-4" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline ml-2"> Failed to load accounts. ({error.message})</span>
        </div>
      )}

      {/* Display the list (handles empty state internally) */}
      {!error && <AccountList accounts={accounts} />}

    </div>
  );
}
