// src/components/accounts/EditAccountForm.js
'use client';

import { useForm } from 'react-hook-form';
import { useState, useTransition } from 'react';
import { updateAccount } from '@/app/(app)/accounts/actions'; // Import the UPDATE action
import Input, { Label } from '@/components/ui/Input';
import Button from '@/components/ui/Button';

// Define or import account types if needed for validation/dropdown
const ACCOUNT_TYPES = ['checking', 'savings', 'credit card', 'cash', 'investment', 'loan', 'other'];

// Accept the existing account data and the close function as props
export default function EditAccountForm({ account, onClose }) {
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm({
      // Pre-fill the form with existing account data
      defaultValues: {
          name: account?.name || '',
          type: account?.type || '',
          current_balance: account?.current_balance || 0,
          identifier: account?.identifier || '',
      }
  });
  const [serverError, setServerError] = useState(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = async (formData) => {
    setServerError(null);

    // Convert form data for the server action
    const data = new FormData();
    Object.keys(formData).forEach(key => {
         // Handle empty identifier - send empty string maybe? Action handles null.
         data.append(key, formData[key]);
    });

    startTransition(async () => {
      // Pass the account ID along with the form data
      const result = await updateAccount(account.id, data);

      if (result.success) {
        // Optionally reset form state if needed, but closing modal handles it
        // reset(formData); // Reset to the new submitted values if staying open
        onClose(); // Close the modal on success
      } else {
        setServerError(result.error || 'An unexpected error occurred during update.');
      }
    });
  };

  return (
    // Pass account.id to the submit handler if not included in formData
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
       {serverError && (
        <p className="text-sm text-red-500 bg-red-900 bg-opacity-30 p-2 rounded">{serverError}</p>
       )}

      {/* Form fields are identical to AddAccountForm, just pre-filled */}
      <div>
        <Label htmlFor={`edit-name-${account.id}`}>Account Name</Label>
        <Input
          id={`edit-name-${account.id}`} // Use unique ID for accessibility if multiple forms exist
          {...register('name', { required: 'Account name is required' })}
          placeholder="e.g., Primary Checking"
          error={errors.name}
          disabled={isPending}
        />
        {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor={`edit-type-${account.id}`}>Account Type</Label>
        <select
          id={`edit-type-${account.id}`}
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
        <Label htmlFor={`edit-balance-${account.id}`}>Current Balance</Label>
        <Input
          id={`edit-balance-${account.id}`}
          type="number"
          step="0.01"
          {...register('current_balance', {
            required: 'Current balance is required',
            valueAsNumber: true,
            validate: value => !isNaN(value) || 'Must be a valid number'
          })}
          placeholder="0.00"
          error={errors.current_balance}
          disabled={isPending}
        />
        {errors.current_balance && <p className="text-sm text-red-500 mt-1">{errors.current_balance.message}</p>}
         {/* Optional: Add warning if manually editing balance */}
         <p className="text-xs text-yellow-400 mt-1">Note: Manually editing balance here bypasses transaction history tracking. Add transactions for automatic updates.</p>
      </div>

      <div>
        <Label htmlFor={`edit-identifier-${account.id}`}>Identifier (Optional)</Label>
        <Input
          id={`edit-identifier-${account.id}`}
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
         <Button
             type="submit"
             variant="primary"
             disabled={isPending || !isDirty} // Disable submit if form hasn't changed
             title={!isDirty ? "No changes detected" : ""}
        >
           {isPending ? 'Saving...' : 'Save Changes'}
         </Button>
       </div>
    </form>
  );
}