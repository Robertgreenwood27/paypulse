// src/components/bills/EditBillForm.js
'use client';

import { useForm } from 'react-hook-form';
import { useState, useTransition, useEffect } from 'react';
import { updateBill } from '@/app/(app)/bills/actions';
import { BILL_FREQUENCIES, BILL_CATEGORIES } from '@/lib/constants/billConstants';
import Input, { Label } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
// We need a way to fetch accounts client-side for the dropdown
// Option 1: Create an API route
// Option 2: Pass accounts down (less ideal if not already available)
// import { getAccountsClient } from '@/lib/client-services/accountService'; // Example client service

export default function EditBillForm({ bill, onClose /*, accounts: initialAccounts */ }) { // Accept initial accounts if passed
    const { register, handleSubmit, reset, watch, formState: { errors, isDirty } } = useForm({
        defaultValues: {
            name: bill?.name || '',
            amount: bill?.amount || '',
            due_date: bill?.due_date ? bill.due_date.split('T')[0] : '', // Format for date input
            frequency: bill?.frequency || '',
            category: bill?.category || '',
            auto_pay: bill?.auto_pay || false,
            account_id: bill?.account_id || ''
        }
    });
    const [serverError, setServerError] = useState(null);
    const [isPending, startTransition] = useTransition();
    // State to hold fetched accounts for the dropdown
    const [accounts, setAccounts] = useState([]);
    const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);

    const autoPayEnabled = watch('auto_pay');
    const today = new Date().toISOString().split('T')[0];

    // --- Fetch Accounts Client-Side when AutoPay is enabled ---
    // This uses a placeholder API route. You need to create this route.
    useEffect(() => {
        async function fetchAccounts() {
            if (autoPayEnabled && accounts.length === 0) { // Fetch only if needed and not already fetched
                setIsLoadingAccounts(true);
                try {
                     // Replace with your actual client-side fetching logic
                     // Example using fetch to an API route:
                    const response = await fetch('/api/user-accounts'); // Create this API route
                    if (!response.ok) throw new Error('Failed to fetch accounts');
                    const data = await response.json();
                    setAccounts(data.accounts || []);
                } catch (error) {
                    console.error("Error fetching accounts for edit form:", error);
                    // Handle error - maybe show a message
                    setServerError("Could not load accounts for Auto Pay selection.");
                } finally {
                    setIsLoadingAccounts(false);
                }
            }
        }
        fetchAccounts();
    }, [autoPayEnabled, accounts.length]); // Re-run if autoPayEnabled changes

    const onSubmit = (formData) => {
        setServerError(null);
        const data = new FormData();

        Object.keys(formData).forEach(key => {
            if (key === 'auto_pay') {
                 if (formData[key] === true) data.append(key, 'on');
            } else if (key === 'account_id') {
                // Only append account_id if auto_pay is enabled AND an account is selected
                if (autoPayEnabled && formData[key]) {
                     data.append(key, formData[key]);
                }
                 // If auto_pay is off, or no account selected, don't append.
                 // The server action handles setting it to null if auto_pay is off.
            } else if (formData[key] !== null && formData[key] !== '') {
                 data.append(key, formData[key]);
            }
        });

         // Ensure account_id is handled correctly server-side if auto_pay is disabled
         if (!autoPayEnabled) {
            // We don't need to explicitly delete here if the server action handles nulling based on auto_pay state
            // data.delete('account_id');
         }


        startTransition(async () => {
            const result = await updateBill(bill.id, data);
            if (result.success) {
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

            {/* Fields are similar to AddBillForm, pre-filled */}
             <div>
                <Label htmlFor={`edit-bill-name-${bill.id}`}>Bill Name</Label>
                <Input id={`edit-bill-name-${bill.id}`} {...register('name', { required: 'Bill name is required' })} error={errors.name} disabled={isPending} />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
            </div>

             <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor={`edit-bill-amount-${bill.id}`}>Amount</Label>
                    <Input id={`edit-bill-amount-${bill.id}`} type="number" step="0.01" {...register('amount', { required: 'Amount is required', valueAsNumber: true, validate: v => v > 0 || 'Positive number' })} error={errors.amount} disabled={isPending} />
                    {errors.amount && <p className="text-sm text-red-500 mt-1">{errors.amount.message}</p>}
                </div>
                <div>
                    <Label htmlFor={`edit-bill-due_date-${bill.id}`}>Due Date</Label>
                    <Input id={`edit-bill-due_date-${bill.id}`} type="date" {...register('due_date', { required: 'Due Date is required' })} min={today} error={errors.due_date} disabled={isPending} className="block w-full rounded-md border-gray-600 bg-gray-700 p-3 text-white shadow-sm [...]" />
                    {errors.due_date && <p className="text-sm text-red-500 mt-1">{errors.due_date.message}</p>}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                 <div>
                     <Label htmlFor={`edit-bill-frequency-${bill.id}`}>Frequency</Label>
                     <select id={`edit-bill-frequency-${bill.id}`} {...register('frequency', { required: 'Frequency is required' })} className="block w-full rounded-md [...] capitalize" disabled={isPending}>
                         <option value="">Select...</option>
                         {BILL_FREQUENCIES.map(freq => <option key={freq} value={freq}>{freq}</option>)}
                     </select>
                     {errors.frequency && <p className="text-sm text-red-500 mt-1">{errors.frequency.message}</p>}
                 </div>
                 <div>
                     <Label htmlFor={`edit-bill-category-${bill.id}`}>Category</Label>
                     <Input id={`edit-bill-category-${bill.id}`} {...register('category', { required: 'Category is required' })} placeholder="e.g., Utilities" error={errors.category} disabled={isPending} />
                     {/* Or use Select */}
                     {errors.category && <p className="text-sm text-red-500 mt-1">{errors.category.message}</p>}
                 </div>
             </div>

             <div className="flex items-center space-x-3">
                <input id={`edit-bill-auto_pay-${bill.id}`} type="checkbox" {...register('auto_pay')} disabled={isPending} className="h-4 w-4 rounded [...]" />
                <Label htmlFor={`edit-bill-auto_pay-${bill.id}`} className="mb-0">Enable Auto Pay</Label>
            </div>

            {/* Conditional Account Selection */}
             {autoPayEnabled && (
                 <div>
                     <Label htmlFor={`edit-bill-account_id-${bill.id}`}>Auto Pay From Account</Label>
                     <select
                         id={`edit-bill-account_id-${bill.id}`}
                         {...register('account_id')} // Registering the field
                         className="block w-full rounded-md border-gray-600 bg-gray-700 p-3 text-white shadow-sm focus:border-accent-green [...] disabled:opacity-60 capitalize"
                         disabled={isPending || isLoadingAccounts || accounts.length === 0}
                     >
                         <option value="">Select Account (Optional)...</option>
                         {accounts.map(acc => (
                             <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                         ))}
                     </select>
                     {isLoadingAccounts && <p className="text-xs text-gray-400 mt-1">Loading accounts...</p>}
                     {!isLoadingAccounts && accounts.length === 0 && <p className="text-xs text-yellow-400 mt-1">No accounts available for selection.</p>}
                     {/* No explicit validation error shown for optional field */}
                 </div>
             )}

            <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={isPending || !isDirty} title={!isDirty ? "No changes detected" : ""}>
                    {isPending ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
        </form>
    );
}