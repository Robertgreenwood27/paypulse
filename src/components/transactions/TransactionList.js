// src/components/transactions/TransactionList.js
import TransactionRow from './TransactionRow';

export default function TransactionList({ transactions }) {
    if (!transactions || transactions.length === 0) {
        return (
            <div className="text-center text-gray-400 py-10 border-2 border-dashed border-gray-600 rounded-lg mt-6">
                <p className="text-lg">No transactions found.</p>
                <p className="mt-1">Click "Add Transaction" to log your first one.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto mt-6">
            <table className="min-w-full bg-gray-800 rounded-lg shadow">
                <thead>
                    <tr className="border-b border-gray-600 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Account</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Description</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4 text-right">Amount</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                    {transactions.filter(t => t && t.id).map((transaction) => (
                        <TransactionRow key={transaction.id} transaction={transaction} />
                    ))}
                </tbody>
            </table>
        </div>
    );
}