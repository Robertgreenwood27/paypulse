// src/app/(app)/income/page.js
import { getIncomeSources } from '@/lib/services/incomeService';
import IncomeList from '@/components/income/IncomeList';
import AddIncomeButton from '@/components/income/AddIncomeButton';

export const dynamic = 'force-dynamic';

export default async function IncomePage() {
    const { incomeSources, error } = await getIncomeSources();

    if (error?.message === 'User not authenticated') {
        return (
            <div className="text-center text-red-400 py-10">
                <p>Authentication required to view income sources.</p>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-white">Income Sources</h1>
                {/* Button to add income will go here */}
                <AddIncomeButton />
            </div>

            {error && (
                <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded mb-4" role="alert">
                    <strong className="font-bold">Error:</strong>
                    <span className="block sm:inline ml-2"> Failed to load income sources. ({error.message})</span>
                </div>
            )}

            {!error && <IncomeList incomeSources={incomeSources} />}
        </div>
    );
}