// src/components/bills/BillCard.js
'use client'; // BillCard is already a client component for delete

import React, { useState, useTransition } from 'react';
import { deleteBill } from '@/app/(app)/bills/actions';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import EditBillForm from './EditBillForm'; // We will create this next

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
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
        return dateString;
    }
};

const getUrgencyClass = (dueDateStr) => {
    if (!dueDateStr) return 'border-gray-700';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dueDateStr + 'T00:00:00');
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'border-red-600';
    if (diffDays <= 7) return 'border-yellow-500';
    return 'border-gray-700';
};

export default function BillCard({ bill }) {
    const [isDeletePending, startDeleteTransition] = useTransition();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    if (!bill) return null;

    const handleDelete = () => {
        if (confirm(`Are you sure you want to delete the bill "${bill.name}"?`)) {
            startDeleteTransition(async () => {
                const result = await deleteBill(bill.id);
                if (!result.success) {
                    alert(`Error deleting bill: ${result.error}`);
                    console.error("Delete Bill Error:", result.error);
                }
            });
        }
    };

    const openEditModal = () => setIsEditModalOpen(true);
    const closeEditModal = () => setIsEditModalOpen(false);

    const urgencyClass = getUrgencyClass(bill.due_date);

    return (
        <>
            <div className={`bg-gray-800 rounded-lg shadow p-4 border-l-4 ${urgencyClass} hover:shadow-md transition-shadow duration-200 flex flex-col justify-between min-h-[180px]`}>
                <div>
                    <div className="flex justify-between items-start mb-2 gap-2">
                        <h3 className="text-lg font-semibold text-white truncate flex-grow" title={bill.name}>{bill.name}</h3>
                        <div className="text-right space-x-1 flex-shrink-0">
                            <Button
                                size="sm" variant="secondary" className="text-xs px-2 py-0.5"
                                onClick={openEditModal}
                                disabled={isDeletePending}
                                title="Edit Bill"
                            > Edit </Button>
                            <Button
                                size="sm" variant="danger" className="text-xs px-2 py-0.5"
                                onClick={handleDelete}
                                disabled={isDeletePending}
                                title="Delete Bill"
                            > {isDeletePending ? '...' : 'Del'} </Button>
                        </div>
                    </div>
                    <p className="text-xl font-bold text-accent-green">
                        {formatCurrency(bill.amount)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 capitalize">{bill.category}</p>
                </div>

                <div>
                    <p className="text-sm text-gray-300 font-medium">
                        Due: <span className={urgencyClass.includes('red') ? 'text-red-400' : urgencyClass.includes('yellow') ? 'text-yellow-400' : ''}>{formatDate(bill.due_date)}</span>
                    </p>
                    <p className="text-sm text-gray-400 capitalize">{bill.frequency}</p>
                    {bill.auto_pay && (
                        <p className="text-xs text-blue-400 mt-1">Auto Pay Enabled</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                        Added: {new Date(bill.created_at).toLocaleDateString()}
                    </p>
                </div>
            </div>

            <Modal isOpen={isEditModalOpen} onClose={closeEditModal} title={`Edit Bill: ${bill.name}`}>
                <EditBillForm bill={bill} onClose={closeEditModal} />
            </Modal>
        </>
    );
}