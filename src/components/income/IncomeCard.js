// src/components/income/IncomeCard.js
'use client'; // Make this a Client Component

import React, { useState, useTransition } from 'react';
import { deleteIncomeSource } from '@/app/(app)/income/actions'; // Import delete action
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import EditIncomeForm from './EditIncomeForm'; // We will create this next

// Define or import formatters
const formatCurrency = (amount) => {
    const numericAmount = Number(amount);
    if (isNaN(numericAmount)) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numericAmount);
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
        return dateString;
    }
};

export default function IncomeCard({ income }) {
    const [isDeletePending, startDeleteTransition] = useTransition();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    if (!income) return null;

    const handleDelete = () => {
        if (confirm(`Are you sure you want to delete the income source "${income.source}"?`)) {
            startDeleteTransition(async () => {
                const result = await deleteIncomeSource(income.id);
                if (!result.success) {
                    alert(`Error deleting income source: ${result.error}`);
                    console.error("Delete Income Error:", result.error);
                }
            });
        }
    };

    const openEditModal = () => setIsEditModalOpen(true);
    const closeEditModal = () => setIsEditModalOpen(false);

    return (
        <>
            <div className="bg-gray-800 rounded-lg shadow p-4 border border-gray-700 hover:border-accent-green transition-colors duration-200 flex flex-col justify-between min-h-[160px]">
                <div>
                    <div className="flex justify-between items-start mb-2 gap-2">
                        <h3 className="text-lg font-semibold text-white truncate flex-grow" title={income.source}>{income.source}</h3>
                        <div className="text-right space-x-1 flex-shrink-0">
                            <Button
                                size="sm" variant="secondary" className="text-xs px-2 py-0.5"
                                onClick={openEditModal}
                                disabled={isDeletePending}
                                title="Edit Income Source"
                            > Edit </Button>
                            <Button
                                size="sm" variant="danger" className="text-xs px-2 py-0.5"
                                onClick={handleDelete}
                                disabled={isDeletePending}
                                title="Delete Income Source"
                            > {isDeletePending ? '...' : 'Del'} </Button>
                        </div>
                    </div>
                    <p className="text-xl font-bold text-green-400">
                        {formatCurrency(income.amount)}
                    </p>
                </div>
                <div>
                    <p className="text-sm text-gray-400 capitalize">{income.frequency}</p>
                    {(income.frequency !== 'once' || income.next_date) && (
                        <p className="text-sm text-gray-400">
                            {income.frequency === 'once' ? 'Date: ' : 'Next: '}
                            <span className="font-medium text-gray-300">{formatDate(income.next_date)}</span>
                        </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                        Added: {new Date(income.created_at).toLocaleDateString()}
                    </p>
                </div>
            </div>

            <Modal isOpen={isEditModalOpen} onClose={closeEditModal} title={`Edit Income Source: ${income.source}`}>
                <EditIncomeForm income={income} onClose={closeEditModal} />
            </Modal>
        </>
    );
}