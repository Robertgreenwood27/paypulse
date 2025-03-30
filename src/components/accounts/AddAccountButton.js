// src/components/accounts/AddAccountButton.js
'use client'; // Needs client state for modal visibility

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import AddAccountForm from './AddAccountForm';

export default function AddAccountButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      <Button variant="primary" onClick={openModal} size="md">
        + Add Account
      </Button>

      <Modal isOpen={isModalOpen} onClose={closeModal} title="Add New Account">
        <AddAccountForm onClose={closeModal} />
      </Modal>
    </>
  );
}