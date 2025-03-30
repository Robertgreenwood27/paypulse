// src/components/accounts/AccountCard.js
'use client'; // Make this a Client Component for interactive features

import React, { useState, useTransition } from 'react';
import { deleteAccount } from '@/app/(app)/accounts/actions';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import EditAccountForm from './EditAccountForm';

// --- Define formatters ONCE here OR (better) import from a utils file ---
const formatCurrency = (amount) => {
    const numericAmount = Number(amount);
    if (isNaN(numericAmount)) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numericAmount);
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        // updated_at likely includes time, so directly using Date should be fine
        const date = new Date(dateString);
        // Check if date is valid after parsing
        if (isNaN(date.getTime())) {
             throw new Error("Invalid date");
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
        console.warn("Error formatting date:", dateString, e); // Log error for debugging
        return dateString; // Fallback to original string if parsing fails
    }
};
// --- End Formatter Definitions ---


export default function AccountCard({ account }) {
    const [isDeletePending, startDeleteTransition] = useTransition();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    if (!account) return null;

    const handleDelete = () => {
        if (confirm(`Are you sure you want to delete the account "${account.name}"? This may also delete associated transactions and history.`)) {
            startDeleteTransition(async () => {
                const result = await deleteAccount(account.id);
                if (!result.success) {
                    alert(`Error deleting account: ${result.error}`);
                    console.error("Delete Account Error:", result.error);
                }
                // Revalidation happens server-side
            });
        }
    };

    const openEditModal = () => setIsEditModalOpen(true);
    const closeEditModal = () => setIsEditModalOpen(false);

    return (
        <>
            <div className="bg-gray-800 rounded-lg shadow p-4 border border-gray-700 hover:border-accent-green transition-colors flex flex-col justify-between min-h-[160px]">
                <div> {/* Top content */}
                    <div className="flex justify-between items-start mb-2 gap-2">
                        <div>
                            <h3 className="text-lg font-semibold text-white">{account.name}</h3>
                            <p className="text-sm text-gray-400 capitalize">{account.type}</p>
                            {account.identifier && (
                                <p className="text-xs text-gray-500"> (...{account.identifier})</p>
                            )}
                        </div>
                        {/* Action Buttons */}
                        <div className="text-right space-x-1 flex-shrink-0">
                             <Button
                                 size="sm"
                                 variant="secondary" // Use secondary or ghost for edit
                                 className="text-xs px-2 py-0.5"
                                 onClick={openEditModal} // Open modal on click
                                 disabled={isDeletePending} // Disable if delete is happening
                                 title="Edit Account"
                             >
                                Edit
                             </Button>
                            <Button
                                size="sm"
                                variant="danger"
                                className="text-xs px-2 py-0.5"
                                onClick={handleDelete}
                                disabled={isDeletePending}
                                title="Delete Account"
                            >
                                {isDeletePending ? '...' : 'Del'}
                            </Button>
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-accent-green mt-1">
                        {/* Use the formatter defined above */}
                        {formatCurrency(account.current_balance)}
                    </p>
                </div>

                 <div> {/* Bottom content */}
                    <p className="text-xs text-gray-500 mt-2">
                        {/* Use the formatter defined above */}
                        Last updated: {formatDate(account.updated_at)}
                    </p>
                 </div>
            </div>

            {/* Edit Modal */}
            <Modal isOpen={isEditModalOpen} onClose={closeEditModal} title={`Edit Account: ${account.name}`}>
                 {/* Pass account data and close function to the form */}
                <EditAccountForm account={account} onClose={closeEditModal} />
            </Modal>
        </>
    );
}