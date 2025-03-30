// src/components/transactions/AddTransactionForm.js
'use client';

import { useForm } from 'react-hook-form';
import { useState, useTransition } from 'react';
import { addTransaction } from '@/app/(app)/transactions/actions';
import { TRANSACTION_TYPES, TRANSACTION_CATEGORIES } from '@/lib/constants/transactionConstants';
import Input, { Label } from '@/components/ui/Input';
import Button from '@/components/ui/Button';

// Accept accounts list as a prop
export default function AddTransactionForm({ accounts = [], onClose }) {
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: {
            account_id: '',
            type: '',
            amount: '',
            date: new Date().toISOString().split('T')[0], // Default to today
            description: '',
            category: '',
            // bill_id: '' // Add later if needed
        }
    });
    const [serverError, setServerError] = useState(null);
    const [isPending, startTransition] = useTransition();

    const onSubmit = (formData) => {
        setServerError(null);
        const data = new FormData();
        Object.keys(formData).forEach(key => {
             if (formData[key] !== null && formData[key] !== '') {
                data.append(key, formData[key]);
            }
        });

        startTransition(async () => {
            const result = await addTransaction(data);
            if (result.success) {
                reset(); // Reset form to defaults
                onClose(); // Close modal
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
                 <Label htmlFor="account_id">Account *</Label>
                 <select
                     id="account_id"
                     {...register('account_id', { required: 'Account is required' })}
                     className="block w-full rounded-md border-gray-600 bg-gray-700 p-3 text-white shadow-sm focus:border-accent-green focus:ring focus:ring-accent-green focus:ring-opacity-50 disabled:opacity-60 capitalize"
                     disabled={isPending || accounts.length === 0}
                 >
                     <option value="">Select Account...</option>
                     {accounts.map(acc => (
                         <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                     ))}
                 </select>
                 {accounts.length === 0 && <p className="text-xs text-yellow-400 mt-1">No accounts found. Add an account first.</p>}
                 {errors.account_id && <p className="text-sm text-red-500 mt-1">{errors.account_id.message}</p>}
             </div>


            <div className="grid grid-cols-3 gap-4">
                <div>
                    <Label htmlFor="type">Type *</Label>
                    <select
                        id="type"
                        {...register('type', { required: 'Type is required' })}
                        className="block w-full rounded-md border-gray-600 bg-gray-700 p-3 text-white shadow-sm focus:border-accent-green focus:ring focus:ring-accent-green focus:ring-opacity-50 disabled:opacity-60 capitalize"
                        disabled={isPending}
                    >
                        <option value="">Select...</option>
                        {TRANSACTION_TYPES.map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                    {errors.type && <p className="text-sm text-red-500 mt-1">{errors.type.message}</p>}
                </div>
                <div>
                    <Label htmlFor="amount">Amount *</Label>
                    <Input
                        id="amount" type="number" step="0.01"
                        {...register('amount', {
                             required: 'Amount is required',
                             valueAsNumber: true,
                             validate: value => (value > 0 && !isNaN(value)) || 'Must be positive'
                         })}
                        placeholder="50.00" error={errors.amount} disabled={isPending}
                    />
                    {errors.amount && <p className="text-sm text-red-500 mt-1">{errors.amount.message}</p>}
                </div>
                 <div>
                    <Label htmlFor="date">Date *</Label>
                    <Input
                        id="date" type="date"
                        {...register('date', { required: 'Date is required' })}
                        error={errors.date} disabled={isPending}
                        className="block w-full rounded-md border-gray-600 bg-gray-700 p-3 text-white shadow-sm focus:border-accent-green focus:ring focus:ring-accent-green focus:ring-opacity-50 disabled:opacity-60"
                    />
                    {errors.date && <p className="text-sm text-red-500 mt-1">{errors.date.message}</p>}
                </div>
            </div>

             <div>
                <Label htmlFor="description">Description</Label>
                <Input
                    id="description" {...register('description')}
                    placeholder="e.g., Groceries, Salary" disabled={isPending}
                />
            </div>

             <div>
                 <Label htmlFor="category">Category</Label>
                 <select
                     id="category"
                     {...register('category')} // Category is optional
                     className="block w-full rounded-md border-gray-600 bg-gray-700 p-3 text-white shadow-sm focus:border-accent-green focus:ring focus:ring-accent-green focus:ring-opacity-50 disabled:opacity-60 capitalize"
                     disabled={isPending}
                 >
                     <option value="">Select Category (Optional)...</option>
                     {TRANSACTION_CATEGORIES.map(cat => (
                         <option key={cat} value={cat}>{cat}</option>
                     ))}
                 </select>
                 {/* OR use an Input for free text category: */}
                 {/* <Input id="category" {...register('category')} placeholder="e.g., Food" disabled={isPending} /> */}
             </div>

             {/* TODO: Add Bill Selection Dropdown if implementing bill linking */}


            <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
                    Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={isPending}>
                    {isPending ? 'Adding...' : 'Add Transaction'}
                </Button>
            </div>
        </form>
    );
}