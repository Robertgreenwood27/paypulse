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

const formatPercentage = (value) => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    return `${value}%`;
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
    const [showDetails, setShowDetails] = useState(false);

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
    const toggleDetails = () => setShowDetails(!showDetails);

    // Determine if this is a credit card
    const isCreditCard = account.type === 'credit card';
    
    // Calculate available credit and utilization for credit cards
    let availableCredit = 0;
    let utilizationRate = 0;
    let minPayment = 0;
    
    if (isCreditCard && account.credit_limit) {
        availableCredit = Math.max(0, account.credit_limit - account.current_balance);
        utilizationRate = account.current_balance > 0 ? 
            (account.current_balance / account.credit_limit) * 100 : 0;
            
        // Calculate minimum payment based on percentage and fixed amount
        if (account.min_payment_percent) {
            minPayment = (account.current_balance * account.min_payment_percent) / 100;
        }
        
        if (account.min_payment_fixed) {
            minPayment += account.min_payment_fixed;
        }
        
        // Handle edge cases
        minPayment = Math.min(minPayment, account.current_balance);
    }
    
    // Get appropriate color for utilization rate
    const getUtilizationColor = (rate) => {
        if (rate >= 75) return 'text-red-400';
        if (rate >= 30) return 'text-yellow-400';
        return 'text-green-400';
    };
    
    const utilizationColor = getUtilizationColor(utilizationRate);

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
                                 variant="secondary" 
                                 className="text-xs px-2 py-0.5"
                                 onClick={openEditModal}
                                 disabled={isDeletePending}
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
                    
                    {isCreditCard ? (
                        <>
                            <p className="text-xs font-medium text-gray-400">Amount Owed</p>
                            <p className="text-2xl font-bold text-red-400">
                                {formatCurrency(account.current_balance)}
                            </p>
                            
                            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <p className="text-gray-400">Credit Limit</p>
                                    <p className="font-medium text-white">{formatCurrency(account.credit_limit)}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400">Available Credit</p>
                                    <p className="font-medium text-green-400">{formatCurrency(availableCredit)}</p>
                                </div>
                            </div>
                            
                            {account.min_payment_percent && (
                                <div className="mt-2">
                                    <p className="text-xs text-gray-400">Est. Minimum Payment</p>
                                    <p className="font-medium text-yellow-400">{formatCurrency(minPayment)}</p>
                                </div>
                            )}
                            
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="mt-2 text-xs w-full"
                                onClick={toggleDetails}
                            >
                                {showDetails ? 'Hide Details' : 'Show Details'}
                            </Button>
                            
                            {showDetails && (
                                <div className="mt-2 pt-2 border-t border-gray-700 grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <p className="text-gray-400">APR</p>
                                        <p className="font-medium text-white">{formatPercentage(account.apr)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400">Utilization</p>
                                        <p className={`font-medium ${utilizationColor}`}>{formatPercentage(utilizationRate.toFixed(1))}</p>
                                    </div>
                                    
                                    {account.min_payment_percent && (
                                        <div>
                                            <p className="text-gray-400">Min Payment %</p>
                                            <p className="font-medium text-white">{formatPercentage(account.min_payment_percent)}</p>
                                        </div>
                                    )}
                                    
                                    {account.min_payment_fixed && (
                                        <div>
                                            <p className="text-gray-400">+ Fixed Amount</p>
                                            <p className="font-medium text-white">{formatCurrency(account.min_payment_fixed)}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        // For non-credit card accounts, show regular balance
                        <p className="text-2xl font-bold text-accent-green mt-1">
                            {formatCurrency(account.current_balance)}
                        </p>
                    )}
                </div>

                 <div> {/* Bottom content */}
                    <p className="text-xs text-gray-500 mt-2">
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