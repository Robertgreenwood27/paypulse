// src/components/transactions/AddTransactionButton.js
'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import AddTransactionForm from './AddTransactionForm';

// This component needs the list of accounts to pass to the form
export default function AddTransactionButton({ accounts = [] }) { // Accept accounts as prop
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    return (
        <>
            <Button variant="primary" onClick={openModal} size="md">
                + Add Transaction
            </Button>

            <Modal isOpen={isModalOpen} onClose={closeModal} title="Add New Transaction">
                {/* Pass accounts and closeModal to the form */}
                <AddTransactionForm accounts={accounts} onClose={closeModal} />
            </Modal>
        </>
    );
}