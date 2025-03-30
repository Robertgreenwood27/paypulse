// src/components/accounts/AddAccountForm.js
'use client'; // Needs client-side interactivity for form handling

import { useForm } from 'react-hook-form';
import { useState, useTransition } from 'react';
import { addAccount } from '@/app/(app)/accounts/actions'; // Import the Server Action
import Input, { Label } from '@/components/ui/Input';
import Button from '@/components/ui/Button';

// Define account types - reuse this definition elsewhere if needed
const ACCOUNT_TYPES = ['checking', 'savings', 'credit card', 'cash', 'investment', 'loan', 'other'];

export default function AddAccountForm({ onClose }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [serverError, setServerError] = useState(null);
  const [isPending, startTransition] = useTransition(); // For loading state during Server Action call

  const onSubmit = async (formData) => {
    setServerError(null); // Clear previous errors

    // Convert form data for the server action
    const data = new FormData();
    Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
    });

    // Use startTransition for the Server Action call
    startTransition(async () => {
      const result = await addAccount(data);

      if (result.success) {
        reset(); // Clear the form
        onClose(); // Close the modal
        // Revalidation happens on the server via revalidatePath
      } else {
        setServerError(result.error || 'An unexpected error occurred.');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
       {serverError && (
        <p className="text-sm text-red-500 bg-red-900 bg-opacity-30 p-2 rounded">{serverError}</p>
       )}

      <div>
        <Label htmlFor="name">Account Name</Label>
        <Input
          id="name"
          {...register('name', { required: 'Account name is required' })}
          placeholder="e.g., Primary Checking"
          error={errors.name}
          disabled={isPending}
        />
        {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor="type">Account Type</Label>
        <select
          id="type"
          {...register('type', { required: 'Account type is required' })}
          className="block w-full rounded-md border-gray-600 bg-gray-700 p-3 text-white shadow-sm focus:border-accent-green focus:ring focus:ring-accent-green focus:ring-opacity-50 disabled:opacity-60"
          disabled={isPending}
        >
          <option value="">Select type...</option>
          {ACCOUNT_TYPES.map(type => (
            <option key={type} value={type} className="capitalize">{type}</option>
          ))}
        </select>
        {errors.type && <p className="text-sm text-red-500 mt-1">{errors.type.message}</p>}
      </div>

      <div>
        <Label htmlFor="current_balance">Current Balance</Label>
        <Input
          id="current_balance"
          type="number"
          step="0.01" // Allow decimal input
          {...register('current_balance', {
            required: 'Current balance is required',
            valueAsNumber: true, // Convert input to number
            validate: value => !isNaN(value) || 'Must be a valid number'
          })}
          placeholder="0.00"
          error={errors.current_balance}
          disabled={isPending}
        />
        {errors.current_balance && <p className="text-sm text-red-500 mt-1">{errors.current_balance.message}</p>}
      </div>

      <div>
        <Label htmlFor="identifier">Identifier (Optional)</Label>
        <Input
          id="identifier"
          {...register('identifier')}
          placeholder="e.g., Last 4 digits (1234)"
          maxLength="50"
          disabled={isPending}
        />
        <p className="text-xs text-gray-400 mt-1">Optional identifier like last 4 digits.</p>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
         <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
           Cancel
         </Button>
         <Button type="submit" variant="primary" disabled={isPending}>
           {isPending ? 'Adding...' : 'Add Account'}
         </Button>
       </div>
    </form>
  );
}