// src/components/income/EditIncomeForm.js
'use client';

import { useForm } from 'react-hook-form';
import { useState, useTransition } from 'react';
import { updateIncomeSource } from '@/app/(app)/income/actions';
import Input, { Label } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { INCOME_FREQUENCIES } from '@/lib/constants/incomeConstants';


export default function EditIncomeForm({ income, onClose }) {
    const { register, handleSubmit, reset, watch, formState: { errors, isDirty } } = useForm({
        // Pre-fill form with existing income data
        defaultValues: {
            source: income?.source || '',
            amount: income?.amount || '',
            // Ensure frequency matches the allowed values
            frequency: income?.frequency && INCOME_FREQUENCIES.includes(income.frequency) ? income.frequency : '',
            // Format date correctly for input type="date" (YYYY-MM-DD)
            next_date: income?.next_date ? income.next_date.split('T')[0] : ''
        }
    });
    const [serverError, setServerError] = useState(null);
    const [isPending, startTransition] = useTransition();

    // Watch frequency to conditionally show/require next_date
    const frequency = watch('frequency');
    const isRecurring = frequency && frequency !== 'once';

    const today = new Date().toISOString().split('T')[0];

    const onSubmit = (formData) => {
        setServerError(null);
        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (formData[key] !== null && formData[key] !== '') { // Append if value exists
                data.append(key, formData[key]);
            } else if (key === 'next_date') {
                 // Explicitly handle clearing the date by not appending if empty
                 // The server action will set it to null if not present
            }
        });

         // If frequency is 'once' and date is empty, ensure it's not sent or handled as null server-side
         if (formData.frequency === 'once' && !formData.next_date) {
            data.delete('next_date');
         }


        startTransition(async () => {
            // Pass the income ID along with the form data
            const result = await updateIncomeSource(income.id, data);
            if (result.success) {
                onClose(); // Close the modal
            } else {
                setServerError(result.error || 'An unexpected error occurred during update.');
            }
        });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
                <p className="text-sm text-red-500 bg-red-900 bg-opacity-30 p-2 rounded">{serverError}</p>
            )}

            {/* Fields are similar to AddIncomeForm */}
             <div>
                <Label htmlFor={`edit-income-source-${income.id}`}>Income Source</Label>
                <Input
                    id={`edit-income-source-${income.id}`}
                    {...register('source', { required: 'Source name is required' })}
                    placeholder="e.g., Paycheck, Freelance Gig"
                    error={errors.source}
                    disabled={isPending}
                />
                {errors.source && <p className="text-sm text-red-500 mt-1">{errors.source.message}</p>}
            </div>

            <div>
                <Label htmlFor={`edit-income-amount-${income.id}`}>Amount (per occurrence)</Label>
                <Input
                    id={`edit-income-amount-${income.id}`}
                    type="number" step="0.01"
                    {...register('amount', {
                        required: 'Amount is required',
                        valueAsNumber: true,
                        validate: value => (value > 0 && !isNaN(value)) || 'Must be a positive number'
                    })}
                    placeholder="1500.00" error={errors.amount} disabled={isPending}
                />
                {errors.amount && <p className="text-sm text-red-500 mt-1">{errors.amount.message}</p>}
            </div>

            <div>
                <Label htmlFor={`edit-income-frequency-${income.id}`}>Frequency</Label>
                <select
                    id={`edit-income-frequency-${income.id}`}
                    {...register('frequency', { required: 'Frequency is required' })}
                    className="block w-full rounded-md border-gray-600 bg-gray-700 p-3 text-white shadow-sm focus:border-accent-green focus:ring focus:ring-accent-green focus:ring-opacity-50 disabled:opacity-60 capitalize"
                    disabled={isPending}
                >
                    <option value="">Select frequency...</option>
                    {INCOME_FREQUENCIES.map(freq => (
                        <option key={freq} value={freq}>{freq}</option>
                    ))}
                </select>
                {errors.frequency && <p className="text-sm text-red-500 mt-1">{errors.frequency.message}</p>}
            </div>

            {/* Conditional Date Input */}
             {(isRecurring || frequency === 'once') && (
                 <div>
                    <Label htmlFor={`edit-income-next_date-${income.id}`}>
                        {isRecurring ? 'Next Income Date' : 'Date (Optional for "once")'}
                    </Label>
                    <Input
                        id={`edit-income-next_date-${income.id}`}
                        type="date"
                        {...register('next_date', { required: isRecurring ? 'Next Date is required' : false })}
                        className="block w-full rounded-md border-gray-600 bg-gray-700 p-3 text-white shadow-sm focus:border-accent-green focus:ring focus:ring-accent-green focus:ring-opacity-50 disabled:opacity-60"
                        min={today} // Optional: Allow editing to past dates? Or keep min=today?
                        error={errors.next_date}
                        disabled={isPending}
                    />
                     {!isRecurring && frequency ==='once' && <p className="text-xs text-gray-400 mt-1">Optional date for one-time income. Clear to remove.</p>}
                    {errors.next_date && <p className="text-sm text-red-500 mt-1">{errors.next_date.message}</p>}
                </div>
            )}


            <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
                    Cancel
                </Button>
                 <Button
                    type="submit" variant="primary"
                    disabled={isPending || !isDirty} // Disable if no changes
                    title={!isDirty ? "No changes detected" : ""}
                >
                    {isPending ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
        </form>
    );
}