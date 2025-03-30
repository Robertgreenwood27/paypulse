// src/components/income/AddIncomeButton.js
'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import AddIncomeForm from './AddIncomeForm'; // Needs form in same directory

export default function AddIncomeButton() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    return (
        <>
            <Button variant="primary" onClick={openModal} size="md">
                + Add Income
            </Button>

            <Modal isOpen={isModalOpen} onClose={closeModal} title="Add New Income Source">
                <AddIncomeForm onClose={closeModal} />
            </Modal>
        </>
    );
}