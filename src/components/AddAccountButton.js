// src/components/accounts/AddAccountButton.js
'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import AddAccountForm from './AddAccountForm'; // Needs AddAccountForm in the same directory

export default function AddAccountButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      <Button variant="primary" onClick={openModal} size="md"> {/* Ensure size is appropriate */}
        + Add Account
      </Button>

      <Modal isOpen={isModalOpen} onClose={closeModal} title="Add New Account">
        {/* Pass the closeModal function to the form */}
        <AddAccountForm onClose={closeModal} />
      </Modal>
    </>
  );
}