// src/components/bills/AddBillButton.js
'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import AddBillForm from './AddBillForm'; // Expecting form in the same directory

export default function AddBillButton() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    return (
        <>
            <Button variant="primary" onClick={openModal} size="md">
                + Add Bill
            </Button>

            <Modal isOpen={isModalOpen} onClose={closeModal} title="Add New Bill">
                {/* Pass closeModal to the form so it can close itself on success */}
                <AddBillForm onClose={closeModal} />
            </Modal>
        </>
    );
}