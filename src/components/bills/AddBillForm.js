// src/components/bills/AddBillForm.js
'use client';

import { useForm } from 'react-hook-form';
import { useState, useTransition, useEffect } from 'react';
import { addBill } from '@/app/(app)/bills/actions';
import { BILL_FREQUENCIES, BILL_CATEGORIES } from '@/lib/constants/billConstants';
import Input, { Label } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
// Import account service if fetching accounts for auto-pay dropdown
// import { getAccounts } from '@/lib/services/accountService'; // This needs to be client-callable or fetched differently

export default function AddBillForm({ onClose }) {
    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
        defaultValues: {
            name: '',
            amount: '',
            due_date: '',
            frequency: '',
            category: '',
            auto_pay: false,
            account_id: '' // For auto-pay selection
        }
    });
    const [serverError, setServerError] = useState(null);
    const [isPending, startTransition] = useTransition();

    // TODO: Fetch user accounts for the account_id dropdown if auto_pay is enabled.
    // This is tricky because getAccounts is currently a server-side function.
    // Options:
    // 1. Create a client-callable API route (/api/accounts) to fetch them.
    // 2. Pass accounts data down from the page (less ideal for a modal).
    // 3. For now, we'll just show a text input or disable this feature.
    // const [accounts, setAccounts] = useState([]);
    // useEffect(() => { /* Fetch accounts here */ }, []);

    const autoPayEnabled = watch('auto_pay');
    const today = new Date().toISOString().split('T')[0];

    const onSubmit = (formData) => {
        setServerError(null);
        const data = new FormData();

        // Append form data, handling checkbox correctly
        Object.keys(formData).forEach(key => {
            if (key === 'auto_pay') {
                // FormData appends 'on' for checked boxes if value isn't set
                if (formData[key] === true) {
                    data.append(key, 'on');
                }
                // If false, don't append (server action handles absence as false)
            } else if (formData[key] !== null && formData[key] !== '') {
                 // Only append if value exists, prevents sending empty strings for optional fields
                 // unless handled specifically (like account_id based on auto_pay)
                 if(key === 'account_id' && !autoPayEnabled) {
                     // Don't send account_id if auto_pay is off
                 } else {
                     data.append(key, formData[key]);
                 }
            }
        });

        // Ensure account_id is not sent if auto_pay is false
        if (!autoPayEnabled) {
            data.delete('account_id');
        }

        startTransition(async () => {
            const result = await addBill(data);
            if (result.success) {
                reset();
                onClose(); // Close the modal
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
                <Label htmlFor="name">Bill Name</Label>
                <Input
                    id="name"
                    {...register('name', { required: 'Bill name is required' })}
                    placeholder="e.g., Rent, Netflix"
                    error={errors.name}
                    disabled={isPending}
                />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        {...register('amount', {
                            required: 'Amount is required',
                            valueAsNumber: true,
                            validate: value => (value > 0 && !isNaN(value)) || 'Must be a positive number'
                        })}
                        placeholder="100.00"
                        error={errors.amount}
                        disabled={isPending}
                    />
                    {errors.amount && <p className="text-sm text-red-500 mt-1">{errors.amount.message}</p>}
                </div>
                <div>
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input
                        id="due_date"
                        type="date"
                        {...register('due_date', { required: 'Due Date is required' })}
                        min={today} // Suggest setting due date today or later
                        error={errors.due_date}
                        disabled={isPending}
                         className="block w-full rounded-md border-gray-600 bg-gray-700 p-3 text-white shadow-sm focus:border-accent-green focus:ring focus:ring-accent-green focus:ring-opacity-50 disabled:opacity-60"
                    />
                    {errors.due_date && <p className="text-sm text-red-500 mt-1">{errors.due_date.message}</p>}
                </div>
            </div>


            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="frequency">Frequency</Label>
                    <select
                        id="frequency"
                        {...register('frequency', { required: 'Frequency is required' })}
                         className="block w-full rounded-md border-gray-600 bg-gray-700 p-3 text-white shadow-sm focus:border-accent-green focus:ring focus:ring-accent-green focus:ring-opacity-50 disabled:opacity-60 capitalize"
                        disabled={isPending}
                    >
                        <option value="">Select...</option>
                        {BILL_FREQUENCIES.map(freq => (
                            <option key={freq} value={freq}>{freq}</option>
                        ))}
                    </select>
                    {errors.frequency && <p className="text-sm text-red-500 mt-1">{errors.frequency.message}</p>}
                </div>
                <div>
                    <Label htmlFor="category">Category</Label>
                    {/* Option 1: Simple Text Input */}
                    <Input
                        id="category"
                        {...register('category', { required: 'Category is required' })}
                        placeholder="e.g., Utilities"
                        error={errors.category}
                        disabled={isPending}
                    />
                    {/* Option 2: Select Dropdown (Uncomment if preferred) */}
                    {/* <select
                         id="category"
                         {...register('category', { required: 'Category is required' })}
                         className="block w-full rounded-md border-gray-600 bg-gray-700 p-3 text-white shadow-sm focus:border-accent-green focus:ring focus:ring-accent-green focus:ring-opacity-50 disabled:opacity-60 capitalize"
                         disabled={isPending}
                     >
                         <option value="">Select...</option>
                         {BILL_CATEGORIES.map(cat => (
                             <option key={cat} value={cat}>{cat}</option>
                         ))}
                     </select> */}
                    {errors.category && <p className="text-sm text-red-500 mt-1">{errors.category.message}</p>}
                </div>
            </div>

            <div className="flex items-center space-x-3">
                <input
                    id="auto_pay"
                    type="checkbox"
                    {...register('auto_pay')}
                    disabled={isPending}
                    className="h-4 w-4 rounded border-gray-500 bg-gray-600 text-accent-green focus:ring-accent-green"
                />
                <Label htmlFor="auto_pay" className="mb-0">Enable Auto Pay</Label> {/* Removed bottom margin */}
            </div>

             {/* Conditional Account Selection - Needs client-side account fetching */}
             {autoPayEnabled && (
                 <div>
                     <Label htmlFor="account_id">Auto Pay From Account (Optional)</Label>
                     {/* Replace with Select dropdown when account fetching is implemented */}
                     <Input
                         id="account_id"
                         {...register('account_id')}
                         placeholder="Enter Account ID (Feature Pending)"
                         disabled={isPending || true} // Disabled until dropdown is ready
                         title="Account selection dropdown coming soon"
                         className="bg-gray-600" // Visually indicate disabled state
                     />
                     <p className="text-xs text-gray-400 mt-1">Select the account this bill is paid from automatically. (Dropdown feature pending).</p>
                     {/* <select
                         id="account_id"
                         {...register('account_id')}
                         className="block w-full rounded-md border-gray-600 bg-gray-700 p-3 text-white shadow-sm focus:border-accent-green focus:ring focus:ring-accent-green focus:ring-opacity-50 disabled:opacity-60"
                         disabled={isPending || accounts.length === 0}
                     >
                         <option value="">Select Account...</option>
                         {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                         ))}
                     </select> */}
                     {errors.account_id && <p className="text-sm text-red-500 mt-1">{errors.account_id.message}</p>}
                 </div>
             )}


            <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
                    Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={isPending}>
                    {isPending ? 'Adding...' : 'Add Bill'}
                </Button>
            </div>
        </form>
    );
}