// src/components/income/AddIncomeForm.js
'use client';

import { useForm } from 'react-hook-form';
import { useState, useTransition, useEffect } from 'react';
import Input, { Label } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { addIncomeSource } from '@/app/(app)/income/actions';
import { INCOME_FREQUENCIES } from '@/lib/constants/incomeConstants';


export default function AddIncomeForm({ onClose }) {
    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
        defaultValues: {
            source: '',
            amount: '',
            frequency: '',
            next_date: '' // Default to empty
        }
    });
    const [serverError, setServerError] = useState(null);
    const [isPending, startTransition] = useTransition();

    // Watch the frequency field to conditionally show/require next_date
    const frequency = watch('frequency');
    const isRecurring = frequency && frequency !== 'once';

    // Get today's date in YYYY-MM-DD format for min attribute
    const today = new Date().toISOString().split('T')[0];

    const onSubmit = (formData) => {
        setServerError(null);
        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (formData[key]) { // Only append if value exists
                data.append(key, formData[key]);
            }
        });

        // If frequency is 'once' but date is empty, don't append it
         if (formData.frequency === 'once' && !formData.next_date) {
            data.delete('next_date');
         }

        startTransition(async () => {
            const result = await addIncomeSource(data);
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
                <Label htmlFor="source">Income Source</Label>
                <Input
                    id="source"
                    {...register('source', { required: 'Source name is required' })}
                    placeholder="e.g., Paycheck, Freelance Gig"
                    error={errors.source}
                    disabled={isPending}
                />
                {errors.source && <p className="text-sm text-red-500 mt-1">{errors.source.message}</p>}
            </div>

            <div>
                <Label htmlFor="amount">Amount (per occurrence)</Label>
                <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    {...register('amount', {
                        required: 'Amount is required',
                        valueAsNumber: true,
                        validate: value => (value > 0 && !isNaN(value)) || 'Must be a positive number'
                    })}
                    placeholder="1500.00"
                    error={errors.amount}
                    disabled={isPending}
                />
                {errors.amount && <p className="text-sm text-red-500 mt-1">{errors.amount.message}</p>}
            </div>

            <div>
                <Label htmlFor="frequency">Frequency</Label>
                <select
                    id="frequency"
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
                    <Label htmlFor="next_date">
                        {isRecurring ? 'Next Income Date' : 'Date (Optional for "once")'}
                    </Label>
                    <Input
                        id="next_date"
                        type="date"
                        // Require only if frequency is recurring
                        {...register('next_date', { required: isRecurring ? 'Next Date is required for recurring income' : false })}
                        className="block w-full rounded-md border-gray-600 bg-gray-700 p-3 text-white shadow-sm focus:border-accent-green focus:ring focus:ring-accent-green focus:ring-opacity-50 disabled:opacity-60"
                        min={today} // Prevent selecting past dates for next income
                        error={errors.next_date}
                        disabled={isPending}
                    />
                     {!isRecurring && frequency ==='once' && <p className="text-xs text-gray-400 mt-1">Optional: Specify the date for this one-time income.</p>}
                    {errors.next_date && <p className="text-sm text-red-500 mt-1">{errors.next_date.message}</p>}
                </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
                    Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={isPending}>
                    {isPending ? 'Adding...' : 'Add Income'}
                </Button>
            </div>
        </form>
    );
}