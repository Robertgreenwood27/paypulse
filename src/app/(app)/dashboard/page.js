// src/app/(app)/dashboard/page.js
import { getAccounts } from '@/lib/services/accountService';
import { getBills } from '@/lib/services/billService';
import { getTransactions } from '@/lib/services/transactionService';
import Link from 'next/link'; // For linking to specific sections

// Reusable formatters (consider moving to a utils file if not already done)
const formatCurrency = (amount) => {
    const numericAmount = Number(amount);
    if (isNaN(numericAmount)) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numericAmount);
};
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) { return dateString; }
};

// Simple card component for dashboard sections
function DashboardCard({ title, link, children }) {
    return (
        <div className="bg-gray-800 rounded-lg shadow p-4 border border-gray-700 hover:border-accent-green transition-colors">
            <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-semibold text-white">{title}</h2>
                {link && (
                    <Link href={link} className="text-sm text-accent-green hover:underline">
                        View All
                    </Link>
                )}
            </div>
            <div className="text-gray-300">
                {children}
            </div>
        </div>
    );
}


export const dynamic = 'force-dynamic'; // Ensure fresh data

export default async function DashboardPage() {
    // Fetch data in parallel
    const [accountsResult, billsResult, transactionsResult] = await Promise.all([
        getAccounts(),
        getBills(),
        getTransactions(null) // Fetch all recent transactions, limited below
    ]);

    const { accounts, error: accountsError } = accountsResult;
    const { bills, error: billsError } = billsResult;
    const { transactions, error: transactionsError } = transactionsResult;

    // Combine errors
    const error = accountsError || billsError || transactionsError;

    if (error?.message === 'User not authenticated') {
        return <div className="text-center text-red-400 py-10"><p>Authentication required.</p></div>;
    }
    if (error) {
         return <div className="text-center text-red-400 py-10"><p>Error loading dashboard data: {error.message}</p></div>;
    }

    // --- Data Processing for Dashboard ---

    // Calculate Total Balance
    const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.current_balance || 0), 0);

    // Find Upcoming Bills (e.g., due within the next 30 days)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next30Days = new Date(today);
    next30Days.setDate(today.getDate() + 30);

    const upcomingBills = bills
        .map(bill => ({ ...bill, dueDateObj: new Date(bill.due_date + 'T00:00:00') }))
        .filter(bill => bill.dueDateObj >= today && bill.dueDateObj <= next30Days)
        .sort((a, b) => a.dueDateObj - b.dueDateObj) // Sort by nearest due date
        .slice(0, 5); // Limit to 5 upcoming

    // Get Recent Transactions (e.g., last 5)
    const recentTransactions = transactions.slice(0, 5);

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-white">Dashboard</h1>

            {/* Main Overview */}
            <div className="mb-6 bg-gray-800 rounded-lg p-4 shadow border border-gray-700">
                <h2 className="text-xl font-semibold text-white mb-2">Financial Overview</h2>
                 <p className="text-3xl font-bold text-accent-green">{formatCurrency(totalBalance)}</p>
                 <p className="text-sm text-gray-400">Total balance across {accounts.length} account(s)</p>
            </div>

            {/* Grid for different sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                 {/* Accounts Summary */}
                 <DashboardCard title="Accounts" link="/accounts">
                     {accounts.length > 0 ? (
                         <ul className="space-y-2">
                             {accounts.slice(0, 4).map(acc => ( // Show first 4 accounts
                                 <li key={acc.id} className="flex justify-between items-center text-sm">
                                     <span>{acc.name} <span className="text-xs text-gray-500 capitalize">({acc.type})</span></span>
                                     <span className="font-medium">{formatCurrency(acc.current_balance)}</span>
                                 </li>
                             ))}
                             {accounts.length > 4 && <li className="text-xs text-gray-400 text-center">...and {accounts.length - 4} more</li>}
                         </ul>
                     ) : (
                         <p className="text-sm text-gray-400">No accounts added yet.</p>
                     )}
                 </DashboardCard>

                 {/* Upcoming Bills */}
                 <DashboardCard title="Upcoming Bills (Next 30 Days)" link="/bills">
                     {upcomingBills.length > 0 ? (
                         <ul className="space-y-2">
                             {upcomingBills.map(bill => (
                                 <li key={bill.id} className="flex justify-between items-center text-sm">
                                     <span>{bill.name} <span className="text-xs text-gray-500">({formatDate(bill.due_date)})</span></span>
                                     <span className="font-medium text-yellow-400">{formatCurrency(bill.amount)}</span>
                                 </li>
                             ))}
                         </ul>
                     ) : (
                         <p className="text-sm text-gray-400">No upcoming bills in the next 30 days.</p>
                     )}
                 </DashboardCard>

                 {/* Recent Transactions */}
                 <DashboardCard title="Recent Activity" link="/transactions">
                      {recentTransactions.length > 0 ? (
                         <ul className="space-y-2">
                             {recentTransactions.map(t => (
                                 <li key={t.id} className="flex justify-between items-center text-sm">
                                     <div>
                                         {t.description || <span className="italic text-gray-500">{t.type}</span>}
                                         <span className="block text-xs text-gray-500">
                                            {formatDate(t.date)} - {t.accounts?.name ?? 'N/A'}
                                         </span>
                                     </div>
                                     <span className={`font-medium ${t.type === 'deposit' ? 'text-green-400' : 'text-red-400'}`}>
                                        {t.type === 'deposit' ? '+' : '-'}{formatCurrency(t.amount)}
                                     </span>
                                 </li>
                             ))}
                         </ul>
                     ) : (
                         <p className="text-sm text-gray-400">No recent transactions.</p>
                     )}
                 </DashboardCard>

                 {/* Placeholder for Charts/Visualizations */}
                 <DashboardCard title="Visualizations">
                     <p className="text-sm text-gray-400">Charts (e.g., Income vs. Expense) will go here.</p>
                     {/* Add Recharts components later */}
                 </DashboardCard>

            </div>
        </div>
    );
}