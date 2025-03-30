// src/app/(app)/bills/page.js
import { getBills } from '@/lib/services/billService';
import BillList from '@/components/bills/BillList'; // Ensure path is correct
import AddBillButton from '@/components/bills/AddBillButton'; // Ensure path is correct
// Optional: Import redirect if needed for auth error handling
// import { redirect } from 'next/navigation';

// Using force-dynamic ensures data freshness on navigation, good starting point
export const dynamic = 'force-dynamic';

export default async function BillsPage() {
  // Fetch bills server-side
  const { bills, error } = await getBills();

  // Handle case where user is not authenticated (service function indicates this)
  if (error?.message === 'User not authenticated') {
       // Middleware should handle this, but provide fallback UI
       return (
            <div className="text-center text-red-400 py-10">
                <p>Authentication required to view bills.</p>
                {/* Optionally redirect: redirect('/login?message=Authentication required'); */}
            </div>
       );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-white">Bills</h1>
        {/* Client component that handles modal logic */}
        <AddBillButton />
      </div>

      {error && ( // Display other potential errors (like DB connection issues)
        <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded mb-4" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline ml-2"> Failed to load bills. ({error.message})</span>
        </div>
      )}

      {/* Display the list (handles empty state internally) */}
      {!error && <BillList bills={bills} />}

    </div>
  );
}