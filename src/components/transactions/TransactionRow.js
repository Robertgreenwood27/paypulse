// src/components/transactions/TransactionRow.js
'use client'; // Needed for delete button interaction

import { deleteTransaction } from '@/app/(app)/transactions/actions';
import Button from '@/components/ui/Button';
import { useTransition } from 'react';

// Reusable formatters (consider moving to a utils file)
const formatCurrency = (amount, type) => {
    const numericAmount = Number(amount);
    if (isNaN(numericAmount)) return 'N/A';
    const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numericAmount);
    if (type === 'deposit') return `+${formatted}`;
    if (type === 'withdrawal' || type === 'transfer') return `-${formatted}`;
    return formatted;
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) { return dateString; }
};

export default function TransactionRow({ transaction }) {
    const [isPending, startTransition] = useTransition();

    if (!transaction) return null;

    const handleDelete = () => {
        if (confirm(`Delete this transaction? (${formatDate(transaction.date)}: ${transaction.description || transaction.type} ${formatCurrency(transaction.amount, transaction.type)})`)) {
            startTransition(async () => {
                const result = await deleteTransaction(transaction.id);
                if (!result.success) {
                    alert(`Error deleting transaction: ${result.error}`);
                    console.error("Delete Transaction Error:", result.error);
                }
            });
        }
    };

    const amountColor = transaction.type === 'deposit' ? 'text-green-400' : 'text-red-400';
    // Account name might be null if join failed or account deleted - handle gracefully
    const accountName = transaction.accounts?.name ?? 'Unknown Account';
    const accountType = transaction.accounts?.type ?? '';

    return (
        <tr className="border-b border-gray-700 hover:bg-gray-750 transition-colors duration-150">
            <td className="py-3 px-4 text-sm text-gray-300">{formatDate(transaction.date)}</td>
            <td className="py-3 px-4 text-sm text-gray-200">
                {accountName}
                {accountType && <span className="text-xs text-gray-500 block capitalize">{accountType}</span>}
            </td>
            <td className="py-3 px-4 text-sm text-gray-300 capitalize">{transaction.type}</td>
            <td className="py-3 px-4 text-sm text-gray-300 truncate max-w-xs" title={transaction.description || ''}>
                {transaction.description || <span className="text-gray-500">N/A</span>}
            </td>
            <td className="py-3 px-4 text-sm text-gray-400 capitalize">
                 {transaction.category || <span className="text-gray-500">N/A</span>}
            </td>
            <td className={`py-3 px-4 text-sm font-medium text-right ${amountColor}`}>
                {formatCurrency(transaction.amount, transaction.type)}
            </td>
            <td className="py-3 px-4 text-right">
                {/* Add Edit button later */}
                <Button
                    variant="danger"
                    size="sm"
                    className="text-xs px-2 py-0.5"
                    onClick={handleDelete}
                    disabled={isPending}
                    title="Delete Transaction"
                >
                    {isPending ? '...' : 'Del'}
                </Button>
            </td>
        </tr>
    );
}