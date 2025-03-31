// src/components/accounts/AddAccountForm.js
// Update to include credit card specific fields
'use client';

import { useForm } from 'react-hook-form';
import { useState, useTransition, useEffect } from 'react';
import { addAccount } from '@/app/(app)/accounts/actions';
import Input, { Label } from '@/components/ui/Input';
import Button from '@/components/ui/Button';

// Define account types - reuse this definition elsewhere if needed
const ACCOUNT_TYPES = ['checking', 'savings', 'credit card', 'cash', 'investment', 'loan', 'other'];

export default function AddAccountForm({ onClose }) {
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const [serverError, setServerError] = useState(null);
  const [isPending, startTransition] = useTransition();
  
  // Watch the type to conditionally show credit card fields
  const accountType = watch('type');
  const isCreditCard = accountType === 'credit card';

  const onSubmit = async (formData) => {
    setServerError(null);

    // Convert form data for the server action
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== undefined && formData[key] !== '') {
        data.append(key, formData[key]);
      }
    });

    startTransition(async () => {
      const result = await addAccount(data);

      if (result.success) {
        reset();
        onClose();
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
          placeholder="e.g., Primary Checking, Chase Sapphire"
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
        <Label htmlFor="current_balance">
          {isCreditCard ? 'Current Balance (Amount Owed)' : 'Current Balance'}
        </Label>
        <Input
          id="current_balance"
          type="number"
          step="0.01"
          {...register('current_balance', {
            required: 'Current balance is required',
            valueAsNumber: true,
            validate: value => !isNaN(value) || 'Must be a valid number'
          })}
          placeholder={isCreditCard ? "1500.00 (amount you owe)" : "0.00"}
          error={errors.current_balance}
          disabled={isPending}
        />
        {isCreditCard && (
          <p className="text-xs text-gray-400 mt-1">Enter the amount you currently owe on this card.</p>
        )}
        {errors.current_balance && <p className="text-sm text-red-500 mt-1">{errors.current_balance.message}</p>}
      </div>

      {isCreditCard && (
        <>
          <div>
            <Label htmlFor="credit_limit">Credit Limit</Label>
            <Input
              id="credit_limit"
              type="number"
              step="0.01"
              {...register('credit_limit', {
                required: 'Credit limit is required for credit cards',
                valueAsNumber: true,
                validate: value => (value > 0 && !isNaN(value)) || 'Must be a positive number'
              })}
              placeholder="5000.00"
              error={errors.credit_limit}
              disabled={isPending}
            />
            {errors.credit_limit && <p className="text-sm text-red-500 mt-1">{errors.credit_limit.message}</p>}
          </div>

          <div>
            <Label htmlFor="apr">APR (%)</Label>
            <Input
              id="apr"
              type="number"
              step="0.01"
              {...register('apr', {
                required: 'APR is required for credit cards',
                valueAsNumber: true,
                validate: value => (value >= 0 && !isNaN(value)) || 'Must be a non-negative number'
              })}
              placeholder="18.99"
              error={errors.apr}
              disabled={isPending}
            />
            {errors.apr && <p className="text-sm text-red-500 mt-1">{errors.apr.message}</p>}
          </div>

          <div>
            <Label htmlFor="min_payment_percent">Minimum Payment (%)</Label>
            <Input
              id="min_payment_percent"
              type="number"
              step="0.01"
              {...register('min_payment_percent', {
                valueAsNumber: true,
                validate: value => (!value || (value > 0 && value <= 100)) || 'Must be between 0 and 100'
              })}
              placeholder="2.00"
              error={errors.min_payment_percent}
              disabled={isPending}
            />
            <p className="text-xs text-gray-400 mt-1">The percentage used to calculate minimum payment (optional).</p>
            {errors.min_payment_percent && <p className="text-sm text-red-500 mt-1">{errors.min_payment_percent.message}</p>}
          </div>

          <div>
            <Label htmlFor="min_payment_fixed">Fixed Minimum Payment</Label>
            <Input
              id="min_payment_fixed"
              type="number"
              step="0.01"
              {...register('min_payment_fixed', {
                valueAsNumber: true,
                validate: value => (!value || (value > 0 && !isNaN(value))) || 'Must be a positive number'
              })}
              placeholder="25.00"
              error={errors.min_payment_fixed}
              disabled={isPending}
            />
            <p className="text-xs text-gray-400 mt-1">Any fixed amount to add to the percentage (optional).</p>
            {errors.min_payment_fixed && <p className="text-sm text-red-500 mt-1">{errors.min_payment_fixed.message}</p>}
          </div>
        </>
      )}

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