// src/components/credit-cards/DebtPayoffCalculator.js
'use client';

import { useState, useEffect } from 'react';
import Input, { Label } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { calculatePayoffTime } from '@/lib/utils/creditCardUtils';

// Utility formatters
const formatCurrency = (amount) => {
  const numericAmount = Number(amount);
  if (isNaN(numericAmount)) return 'N/A';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numericAmount);
};

const formatDate = (months) => {
  if (!months || isNaN(months) || months === Infinity) return 'N/A';
  
  const years = Math.floor(months / 12);
  const remainingMonths = Math.ceil(months % 12);
  
  if (years > 0 && remainingMonths > 0) {
    return `${years} year${years > 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
  } else if (years > 0) {
    return `${years} year${years > 1 ? 's' : ''}`;
  } else {
    return `${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
  }
};

export default function DebtPayoffCalculator({ creditCards }) {
  const [monthlyCreditCardPayment, setMonthlyCreditCardPayment] = useState(0);
  const [payoffStrategy, setPayoffStrategy] = useState('avalanche'); // 'avalanche' or 'snowball'
  const [cards, setCards] = useState([]);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Initialize cards with the data from the creditCards prop
    const initialCards = creditCards.map(card => ({
      id: card.id,
      name: card.name,
      balance: card.current_balance || 0,
      apr: card.apr || 0,
      minPayment: 0, // Will be calculated
      extraPayment: 0, // Will be calculated
      monthsToPayoff: 0, // Will be calculated
      totalInterest: 0, // Will be calculated
      paymentOrder: 0, // Will be assigned based on strategy
    }));
    
    setCards(initialCards);
  }, [creditCards]);
  
  const calculatePayoffPlan = () => {
    setError(null);
    
    try {
      if (!monthlyCreditCardPayment || monthlyCreditCardPayment <= 0) {
        setError('Please enter a valid monthly payment amount.');
        return;
      }
      
      // Calculate total minimum payments
      const totalMinPayments = cards.reduce((sum, card) => {
        // Simple minimum payment calculation (2% of balance or $25, whichever is higher)
        const minPayment = Math.max((card.balance * 0.02), 25);
        return sum + Math.min(minPayment, card.balance); // Min payment can't exceed balance
      }, 0);
      
      if (monthlyCreditCardPayment < totalMinPayments) {
        setError(`Your monthly payment must be at least ${formatCurrency(totalMinPayments)} to cover all minimum payments.`);
        return;
      }
      
      // Sort cards based on strategy
      let sortedCards = [...cards].filter(card => card.balance > 0); // Only include cards with balances
      
      if (payoffStrategy === 'avalanche') {
        // Sort by highest APR first (debt avalanche)
        sortedCards.sort((a, b) => b.apr - a.apr);
      } else {
        // Sort by lowest balance first (debt snowball)
        sortedCards.sort((a, b) => a.balance - b.balance);
      }
      
      // Assign payment order
      sortedCards.forEach((card, index) => {
        card.paymentOrder = index + 1;
      });
      
      // Calculate minimum payments for each card
      let remainingPayment = monthlyCreditCardPayment;
      
      // First pass: assign minimum payments
      sortedCards = sortedCards.map(card => {
        // Simple minimum payment calculation (2% of balance or $25, whichever is higher)
        const minPayment = Math.max((card.balance * 0.02), 25);
        card.minPayment = Math.min(minPayment, card.balance); // Min payment can't exceed balance
        remainingPayment -= card.minPayment;
        return card;
      });
      
      // Second pass: distribute extra payment according to strategy
      for (let i = 0; i < sortedCards.length && remainingPayment > 0; i++) {
        sortedCards[i].extraPayment = Math.min(remainingPayment, sortedCards[i].balance - sortedCards[i].minPayment);
        remainingPayment -= sortedCards[i].extraPayment;
      }
      
      // Third pass: calculate payoff time and interest for each card
      let maxMonths = 0;
      let totalInterest = 0;
      
      sortedCards = sortedCards.map(card => {
        const monthlyPayment = card.minPayment + card.extraPayment;
        const { months, totalInterest: interest } = calculatePayoffTime(
          card.balance, 
          card.apr, 
          monthlyPayment
        );
        
        card.monthsToPayoff = months;
        card.totalInterest = interest;
        
        if (months > maxMonths) {
          maxMonths = months;
        }
        
        totalInterest += interest;
        
        return card;
      });
      
      // Update the cards state with the calculated values
      const updatedCards = [...cards];
      sortedCards.forEach(sortedCard => {
        const index = updatedCards.findIndex(card => card.id === sortedCard.id);
        if (index !== -1) {
          updatedCards[index] = sortedCard;
        }
      });
      
      setCards(updatedCards);
      
      // Set results
      setResults({
        totalMonths: maxMonths,
        totalInterest,
        totalPaid: totalInterest + cards.reduce((sum, card) => sum + card.balance, 0),
        averageMonthlyPayment: monthlyCreditCardPayment,
      });
      
    } catch (err) {
      console.error('Error calculating payoff plan:', err);
      setError('An error occurred while calculating your payoff plan.');
    }
  };
  
  const handlePaymentChange = (e) => {
    const value = parseFloat(e.target.value);
    setMonthlyCreditCardPayment(value);
  };
  
  const handleStrategyChange = (e) => {
    setPayoffStrategy(e.target.value);
  };
  
  // Filter out cards with zero balance
  const cardsWithBalance = cards.filter(card => card.balance > 0);
  const totalDebt = cards.reduce((sum, card) => sum + card.balance, 0);

  return (
    <div className="bg-gray-800 rounded-lg p-5 border border-gray-700 shadow">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-3">Your Credit Card Debt</h2>
        
        <div className="flex justify-between items-center mb-4">
          <p className="text-gray-300">Total Debt:</p>
          <p className="text-2xl font-bold text-red-400">{formatCurrency(totalDebt)}</p>
        </div>
        
        {cardsWithBalance.length > 0 ? (
          <div className="border-t border-gray-700 pt-3">
            <table className="w-full">
              <thead className="text-left text-gray-400 text-sm">
                <tr>
                  <th className="pb-2">Card</th>
                  <th className="pb-2 text-right">Balance</th>
                  <th className="pb-2 text-right">APR</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                {cardsWithBalance.map(card => (
                  <tr key={card.id} className="border-b border-gray-700">
                    <td className="py-2">{card.name}</td>
                    <td className="py-2 text-right font-medium">{formatCurrency(card.balance)}</td>
                    <td className="py-2 text-right">{card.apr}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-center py-4">No credit card debt found.</p>
        )}
      </div>
      
      {cardsWithBalance.length > 0 && (
        <>
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="monthly-payment">Monthly Payment Amount</Label>
              <Input
                id="monthly-payment"
                type="number"
                step="0.01"
                placeholder="e.g., 500"
                value={monthlyCreditCardPayment || ''}
                onChange={handlePaymentChange}
                className="bg-gray-700"
              />
            </div>
            
            <div>
              <Label htmlFor="strategy">Payoff Strategy</Label>
              <select
                id="strategy"
                value={payoffStrategy}
                onChange={handleStrategyChange}
                className="block w-full rounded-md border-gray-600 bg-gray-700 p-3 text-white shadow-sm focus:border-accent-green focus:ring focus:ring-accent-green focus:ring-opacity-50"
              >
                <option value="avalanche">Debt Avalanche (Highest Interest First)</option>
                <option value="snowball">Debt Snowball (Lowest Balance First)</option>
              </select>
            </div>
          </div>
          
          <div className="mb-6">
            <Button variant="primary" onClick={calculatePayoffPlan} className="w-full py-3">
              Calculate Payoff Plan
            </Button>
            
            {error && (
              <p className="text-red-400 text-sm mt-2 bg-red-900 bg-opacity-30 p-2 rounded">{error}</p>
            )}
          </div>
          
          {results && (
            <div className="mb-6 border-t border-gray-700 pt-4">
              <h3 className="text-lg font-semibold text-white mb-3">Your Payoff Results</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-700 p-3 rounded">
                  <p className="text-sm text-gray-400">Total Time to Debt Freedom</p>
                  <p className="text-xl font-bold text-accent-green">{formatDate(results.totalMonths)}</p>
                </div>
                
                <div className="bg-gray-700 p-3 rounded">
                  <p className="text-sm text-gray-400">Total Interest Paid</p>
                  <p className="text-xl font-bold text-red-400">{formatCurrency(results.totalInterest)}</p>
                </div>
              </div>
              
              <h4 className="text-white font-medium mb-2">Payoff Order</h4>
              
              <table className="w-full">
                <thead className="text-left text-gray-400 text-sm">
                  <tr>
                    <th className="pb-2">Order</th>
                    <th className="pb-2">Card</th>
                    <th className="pb-2 text-right">Monthly Payment</th>
                    <th className="pb-2 text-right">Months</th>
                    <th className="pb-2 text-right">Interest</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  {cards
                    .filter(card => card.balance > 0)
                    .sort((a, b) => a.paymentOrder - b.paymentOrder)
                    .map(card => (
                      <tr key={card.id} className="border-b border-gray-700">
                        <td className="py-2">{card.paymentOrder}</td>
                        <td className="py-2">{card.name}</td>
                        <td className="py-2 text-right">{formatCurrency(card.minPayment + card.extraPayment)}</td>
                        <td className="py-2 text-right">{Math.ceil(card.monthsToPayoff)}</td>
                        <td className="py-2 text-right">{formatCurrency(card.totalInterest)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
              
              <div className="mt-4 bg-gray-700 p-3 rounded">
                <p className="text-sm">
                  {payoffStrategy === 'avalanche' ? (
                    <>
                      <span className="font-medium text-accent-green">Debt Avalanche Strategy:</span> 
                      {" "}Paying highest interest rate cards first saves you the most money in interest.
                    </>
                  ) : (
                    <>
                      <span className="font-medium text-accent-green">Debt Snowball Strategy:</span>
                      {" "}Paying smallest balances first provides psychological wins to keep you motivated.
                    </>
                  )}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}