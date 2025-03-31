// src/components/transactions/AddTransactionForm.js
'use client';

import { useForm } from 'react-hook-form';
import { useState, useTransition, useEffect } from 'react';
import { addTransaction } from '@/app/(app)/transactions/actions';
import { TRANSACTION_TYPES, TRANSACTION_CATEGORIES } from '@/lib/constants/transactionConstants';
import Input, { Label } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { calculateMinimumPayment } from '@/lib/utils/creditCardUtils';

// Accept accounts list as a prop
export default function AddTransactionForm({ accounts = [], onClose }) {
    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
        defaultValues: {
            account_id: '',
            type: '',
            amount: '',
            date: new Date().toISOString().split('T')[0], // Default to today
            description: '',
            category: '',
            is_credit_card_payment: false,
            is_minimum_payment: false,
            payment_to_account_id: ''
        }
    });
    const [serverError, setServerError] = useState(null);
    const [isPending, startTransition] = useTransition();
    const [creditCards, setCreditCards] = useState([]);
    const [selectedCardDetails, setSelectedCardDetails] = useState(null);
    const [calculatedMinPayment, setCalculatedMinPayment] = useState(0);

    // Watch key fields to handle conditionals
    const transactionType = watch('type');
    const accountId = watch('account_id');
    const amount = watch('amount');
    const isCreditCardPayment = watch('is_credit_card_payment');
    const selectedPaymentAccount = watch('payment_to_account_id');

    // Filter for credit cards when component loads
    useEffect(() => {
        const filteredCards = accounts.filter(acc => acc.type === 'credit card');
        setCreditCards(filteredCards);
    }, [accounts]);

    // Update description when credit card payment is selected
    useEffect(() => {
        if (isCreditCardPayment && selectedPaymentAccount) {
            const selectedCard = accounts.find(acc => acc.id === selectedPaymentAccount);
            if (selectedCard) {
                setValue('description', `Payment to ${selectedCard.name}`);
                setValue('category', 'Credit Card Payment');
                
                // Set selected card details for minimum payment calculation
                setSelectedCardDetails(selectedCard);
                
                // Calculate minimum payment if card has the necessary fields
                if (selectedCard.current_balance && 
                    (selectedCard.min_payment_percent || selectedCard.min_payment_fixed)) {
                    const minPayment = calculateMinimumPayment(
                        selectedCard.current_balance,
                        selectedCard.min_payment_percent || 2,
                        selectedCard.min_payment_fixed || 25
                    );
                    setCalculatedMinPayment(minPayment);
                }
            }
        }
    }, [isCreditCardPayment, selectedPaymentAccount, accounts, setValue]);

    // Handle "use minimum payment" button click
    const handleUseMinPayment = () => {
        if (calculatedMinPayment > 0) {
            setValue('amount', calculatedMinPayment.toFixed(2));
            setValue('is_minimum_payment', true);
        }
    };

    const onSubmit = (formData) => {
        setServerError(null);
        const data = new FormData();
        
        // Format for the server action
        for (const key in formData) {
            if (formData[key] !== null && formData[key] !== '' && 
                // Skip credit card payment metadata fields which are for UI only
                !['is_credit_card_payment', 'payment_to_account_id'].includes(key)) {
                
                // Handle boolean is_minimum_payment
                if (key === 'is_minimum_payment') {
                    if (formData[key]) {
                        data.append(key, 'true');
                    }
                } else {
                    data.append(key, formData[key]);
                }
            }
        }

        // Add credit card reference if it's a payment
        if (isCreditCardPayment && selectedPaymentAccount) {
            data.append('payment_to_account_id', selectedPaymentAccount);
        }

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

            {/* Credit Card Payment Option - show for withdrawals */}
            {transactionType === 'withdrawal' && accountId && (
                <div className="border-t border-gray-700 pt-4 mt-2">
                    <div className="flex items-center space-x-3">
                        <input
                            id="is_credit_card_payment"
                            type="checkbox"
                            {...register('is_credit_card_payment')}
                            disabled={isPending || creditCards.length === 0}
                            className="h-4 w-4 rounded border-gray-500 bg-gray-600 text-accent-green focus:ring-accent-green"
                        />
                        <Label htmlFor="is_credit_card_payment" className="mb-0">This is a credit card payment</Label>
                    </div>
                    
                    {isCreditCardPayment && (
                        <div className="mt-3 ml-7">
                            <Label htmlFor="payment_to_account_id">Select Credit Card</Label>
                            <select
                                id="payment_to_account_id"
                                {...register('payment_to_account_id', { 
                                    required: isCreditCardPayment ? 'Select which credit card you are paying' : false 
                                })}
                                className="block w-full rounded-md border-gray-600 bg-gray-700 p-3 text-white shadow-sm focus:border-accent-green focus:ring focus:ring-accent-green focus:ring-opacity-50 disabled:opacity-60"
                                disabled={isPending || creditCards.length === 0}
                            >
                                <option value="">Select Credit Card...</option>
                                {creditCards.map(card => (
                                    <option key={card.id} value={card.id}>
                                        {card.name} (Balance: ${card.current_balance})
                                    </option>
                                ))}
                            </select>
                            {errors.payment_to_account_id && (
                                <p className="text-sm text-red-500 mt-1">{errors.payment_to_account_id.message}</p>
                            )}
                            
                            {/* Minimum Payment UI */}
                            {selectedCardDetails && calculatedMinPayment > 0 && (
                                <div className="mt-3 bg-gray-700 p-3 rounded">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-sm text-gray-300">Minimum Payment</p>
                                            <p className="text-xl font-bold text-yellow-400">
                                                ${calculatedMinPayment.toFixed(2)}
                                            </p>
                                        </div>
                                        <Button 
                                            type="button" 
                                            variant="secondary" 
                                            size="sm"
                                            onClick={handleUseMinPayment}
                                        >
                                            Use Minimum
                                        </Button>
                                    </div>
                                    
                                    <div className="mt-2 flex items-center space-x-3">
                                        <input
                                            id="is_minimum_payment"
                                            type="checkbox"
                                            {...register('is_minimum_payment')}
                                            disabled={isPending}
                                            className="h-4 w-4 rounded border-gray-500 bg-gray-600 text-accent-green focus:ring-accent-green"
                                        />
                                        <Label htmlFor="is_minimum_payment" className="mb-0 text-sm">
                                            This is a minimum payment only
                                        </Label>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

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
            </div>

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