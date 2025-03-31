// src/components/credit-cards/DebtPayoffCalculator.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import Input, { Label } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { calculateActualMinimumPayment } from '@/lib/utils/creditCardUtils'; // Use the actual min payment function

// Utility formatters
const formatCurrency = (amount) => {
  const numericAmount = Number(amount);
  if (isNaN(numericAmount)) return 'N/A';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numericAmount);
};

const formatDate = (months) => {
  if (months === null || months === undefined || isNaN(months)) return 'N/A'; // Handle null/undefined/NaN
  if (months === Infinity) return 'Never (Payment too low)';
  if (months <= 0) return 'Paid Off'; // Handle 0 or negative months correctly

  const years = Math.floor(months / 12);
  // Use Math.round for remaining months to avoid showing "0 months" when it's close to a full year
  // or handle the "less than 1 month" case better
  const remainingMonths = Math.round(months % 12);

  if (months < 1) {
      return 'Less than 1 month';
  } else if (years > 0 && remainingMonths > 0) {
    return `${years} year${years > 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
  } else if (years > 0) {
    return `${years} year${years > 1 ? 's' : ''}`;
  } else if (remainingMonths > 0) {
    return `${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
  } else {
     // This case should ideally not be reached if months > 0 due to rounding/check above
     // But as a fallback, if months was exactly 12, 24 etc.
     return `${years} year${years > 1 ? 's' : ''}`;
  }
};


export default function DebtPayoffCalculator({ creditCards }) {
  const [monthlyCreditCardPayment, setMonthlyCreditCardPayment] = useState(''); // Keep as string for input
  const [payoffStrategy, setPayoffStrategy] = useState('avalanche'); // 'avalanche' or 'snowball'
  const [cards, setCards] = useState([]);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [calculating, setCalculating] = useState(false);

  // Initialize card state from props
  useEffect(() => {
    const initialCards = creditCards.map(card => ({
      id: card.id,
      name: card.name,
      balance: Number(card.current_balance) || 0,
      apr: Number(card.apr) || 0,
      // Calculated fields will be populated by the simulation
      minPayment: 0, // Represents the *first* minimum calculated (mostly informational)
      monthsToPayoff: null,
      totalInterest: 0,
      paymentOrder: 0,
      initialBalance: Number(card.current_balance) || 0, // Store initial for display and total paid calc
    }));
    setCards(initialCards);
    setResults(null); // Reset results when cards change
    setError(null);
  }, [creditCards]);

  // Memoize calculation to avoid re-running on every render if inputs haven't changed
  const calculatePayoffPlan = useCallback(() => {
    setError(null);
    setCalculating(true);
    setResults(null); // Clear previous results

    const paymentAmount = parseFloat(monthlyCreditCardPayment);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      setError('Please enter a valid positive monthly payment amount.');
      setCalculating(false);
      return;
    }

    // --- Prepare Simulation Data ---
    // Use a deep copy for simulation & initialize/reset simulation-specific fields
    let simulationCards = JSON.parse(JSON.stringify(cards))
        .filter(card => card.balance > 0)
        .map(card => ({
            ...card,
            totalInterest: 0, // Reset accumulated interest for this run
            monthsToPayoff: null, // Reset payoff month for this run
            interestForCurrentMonth: 0, // Add temporary property for calculation
            currentBalance: card.balance // Use a separate field for the simulation balance
        }));


    if (simulationCards.length === 0) {
      // setError('No credit card debt to calculate.'); // Or just show nothing
      setCalculating(false);
      return;
    }

    // --- Initial Minimum Payment Check ---
    let totalInitialMinPayments = 0;
    try {
        totalInitialMinPayments = simulationCards.reduce((sum, card) => {
            // Use the actual minimum payment calculation based on starting balance
            const minPay = calculateActualMinimumPayment(card.currentBalance, card.apr);
            return sum + minPay;
        }, 0);
    } catch (calcError) {
        console.error("Error calculating initial minimum payments:", calcError);
        setError("Error calculating minimum payments. Check card APRs.");
        setCalculating(false);
        return;
    }

     // Round comparison values to avoid floating point issues in the check
     const roundedPaymentAmount = Math.round(paymentAmount * 100) / 100;
     const roundedTotalMinPayments = Math.round(totalInitialMinPayments * 100) / 100;


    if (roundedPaymentAmount < roundedTotalMinPayments && roundedTotalMinPayments > 0) {
      setError(`Your monthly payment of ${formatCurrency(paymentAmount)} must be at least ${formatCurrency(totalInitialMinPayments)} to cover initial minimum payments.`);
      setCalculating(false);
      return;
    }

    // --- Simulation Start ---
    let currentMonth = 0;
    let totalInterestPaidOverall = 0;
    const MAX_MONTHS = 720; // 60 years safety break

    while (simulationCards.some(card => card.currentBalance > 0.005) && currentMonth < MAX_MONTHS) {
      currentMonth++;
      let paymentRemaining = paymentAmount;

      // 1. Sort cards for this month's payment allocation
      simulationCards.sort((a, b) => {
        const aBal = a.currentBalance;
        const bBal = b.currentBalance;
        if (aBal <= 0.005 && bBal <= 0.005) return 0; // Keep paid cards order stable
        if (aBal <= 0.005) return 1; // Paid cards go to the end
        if (bBal <= 0.005) return -1; // Paid cards go to the end

        if (payoffStrategy === 'avalanche') {
          // Highest APR first, then lowest balance as tie-breaker
          return b.apr - a.apr || aBal - bBal;
        } else { // snowball
          // Lowest balance first, then highest APR as tie-breaker
          return aBal - bBal || b.apr - a.apr;
        }
      });

      const targetCardIndex = simulationCards.findIndex(c => c.currentBalance > 0.005); // First active card is target

      // 2. Calculate interest for all active cards and store it temporarily
      for (let i = 0; i < simulationCards.length; i++) {
        const card = simulationCards[i];
        if (card.currentBalance <= 0.005) {
            card.interestForCurrentMonth = 0; // No interest if paid off
            continue;
        };

        const monthlyRate = card.apr / 100 / 12;
        card.interestForCurrentMonth = card.currentBalance * monthlyRate;
      }

       // 3. Apply Interest and Payments
       for (let i = 0; i < simulationCards.length; i++) {
           const card = simulationCards[i];
           if (card.currentBalance <= 0.005) continue; // Skip paid cards

           // Add interest for this month
           const interestAdded = card.interestForCurrentMonth;
           card.currentBalance += interestAdded;
           card.totalInterest += interestAdded; // Accumulate total interest per card
           totalInterestPaidOverall += interestAdded; // Accumulate overall interest

           // Check if paid off just by interest (highly unlikely, but safety)
            if (card.currentBalance <= 0.005 && card.monthsToPayoff === null) {
                card.monthsToPayoff = currentMonth;
                card.currentBalance = 0;
            }

            // Determine payment for this card (if payment available)
            if (paymentRemaining > 0.005 && card.currentBalance > 0.005) {
                let paymentForThisCard = 0;

                // Base minimum calculation on balance *before* interest was added
                const balanceBeforeInterest = Math.max(0, card.currentBalance - interestAdded);
                const minPayment = calculateActualMinimumPayment(balanceBeforeInterest, card.apr);

                if (i === targetCardIndex) {
                    // Target card gets the *larger* of its minimum or the remaining payment snowball
                    const paymentTowardsTarget = Math.max(minPayment, paymentRemaining);
                    paymentForThisCard = Math.min(card.currentBalance, paymentTowardsTarget, paymentRemaining);
                } else {
                    // Non-target cards get their minimum payment
                    paymentForThisCard = Math.min(card.currentBalance, minPayment, paymentRemaining);
                }

                // Ensure payment isn't negative or impossibly small
                paymentForThisCard = Math.max(0, paymentForThisCard);
                 // Round payment to avoid tiny fractions causing issues
                 paymentForThisCard = Math.round(paymentForThisCard * 100) / 100;


                card.currentBalance -= paymentForThisCard;
                paymentRemaining -= paymentForThisCard;

                // Record payoff month if balance drops to zero or below *after payment*
                if (card.currentBalance <= 0.005 && card.monthsToPayoff === null) {
                  card.monthsToPayoff = currentMonth;
                  card.currentBalance = 0; // Set exactly to zero
                }
            }
       }

         // If there's still payment remaining after applying to all cards (e.g., total payment > total debt + interest)
         // it just means everything is paid off this month. The loop condition will handle this.

    } // End of while loop (month simulation)

    // --- Simulation End ---

    if (currentMonth >= MAX_MONTHS) {
      setError("Calculation timed out or payment is too low. The debt may not be fully payable with the provided payment amount within 60 years.");
      setCalculating(false);
      // Mark remaining cards as never paid off
       simulationCards.forEach(card => {
           if (card.currentBalance > 0.005 && card.monthsToPayoff === null) {
               card.monthsToPayoff = Infinity;
           }
       });
       // Proceed to show results, including the 'Infinity' cards
    }

    // --- Final Calculation and State Update ---
    const finalCardsState = cards.map(originalCard => {
      const simCard = simulationCards.find(sc => sc.id === originalCard.id);
      if (simCard) {
         // Determine the display order based on the *initial* state and chosen strategy
         const paymentOrder = cards // Use original 'cards' array to determine initial sort order
              .filter(c => c.initialBalance > 0.005) // Only cards that started with debt
              .sort((a, b) => {
                 if (payoffStrategy === 'avalanche') {
                    // Highest APR first, then lowest balance
                    return b.apr - a.apr || a.initialBalance - b.initialBalance;
                 } else { // snowball
                    // Lowest balance first, then highest APR
                    return a.initialBalance - b.initialBalance || b.apr - a.apr;
                 }
              })
              .findIndex(c => c.id === simCard.id) + 1; // +1 for 1-based indexing

        return {
          ...originalCard, // Keep original immutable data like name, initialBalance
           // If simulation finished early (currentMonth < MAX_MONTHS) and month wasn't set,
           // but balance is 0, it finished in 'currentMonth'. If balance > 0, it's Infinity.
          monthsToPayoff: simCard.monthsToPayoff ?? (simCard.currentBalance <= 0.005 ? currentMonth : Infinity),
          totalInterest: simCard.totalInterest || 0,
          paymentOrder: originalCard.initialBalance > 0.005 ? paymentOrder : 0, // Assign order only if it had debt
        };
      }
      // Card wasn't in simulation (e.g., started with 0 balance)
      return { ...originalCard, paymentOrder: 0, monthsToPayoff: 0, totalInterest: 0 };
    });

    // Update the main state with the results
    setCards(finalCardsState);

    const totalInitialDebt = cards.reduce((sum, card) => sum + card.initialBalance, 0);
    const finalTotalPaid = totalInitialDebt + totalInterestPaidOverall;

    setResults({
      totalMonths: currentMonth >= MAX_MONTHS ? Infinity : currentMonth,
      totalInterest: totalInterestPaidOverall,
      totalPaid: finalTotalPaid,
      averageMonthlyPayment: paymentAmount, // This is the user's input payment
      payoffStrategy: payoffStrategy,
    });

    setCalculating(false);

  }, [monthlyCreditCardPayment, payoffStrategy, cards]); // Include cards in dependency


  const handlePaymentChange = (e) => {
    setMonthlyCreditCardPayment(e.target.value);
    setResults(null); // Clear results on input change
    setError(null); // Clear error on input change
  };

  const handleStrategyChange = (e) => {
    setPayoffStrategy(e.target.value);
    setResults(null); // Clear results on strategy change
    setError(null); // Clear error on strategy change
  };

  // Use initialBalance for display in the top section and results table
  const cardsWithInitialBalance = cards.filter(card => card.initialBalance > 0.005);
  const totalInitialDebt = cards.reduce((sum, card) => sum + card.initialBalance, 0);

  return (
    <div className="bg-gray-800 rounded-lg p-5 border border-gray-700 shadow">
      {/* Initial Debt Summary */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-3">Your Credit Card Debt</h2>
        <div className="flex justify-between items-center mb-4">
          <p className="text-gray-300">Total Initial Debt:</p>
          <p className="text-2xl font-bold text-red-400">{formatCurrency(totalInitialDebt)}</p>
        </div>
        {cardsWithInitialBalance.length > 0 ? (
          <div className="border-t border-gray-700 pt-3 max-h-60 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-400">
                <tr>
                  <th className="pb-2 font-medium">Card</th>
                  <th className="pb-2 text-right font-medium">Balance</th>
                  <th className="pb-2 text-right font-medium">APR (%)</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                {cardsWithInitialBalance.map(card => (
                  <tr key={card.id} className="border-b border-gray-700 last:border-b-0">
                    <td className="py-2">{card.name}</td>
                    <td className="py-2 text-right font-medium">{formatCurrency(card.initialBalance)}</td>
                    <td className="py-2 text-right">{card.apr?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-center py-4">No credit card debt found to calculate.</p>
        )}
      </div>

      {/* Calculation Inputs and Button (Only if there's initial debt) */}
      {totalInitialDebt > 0.005 && (
        <>
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="monthly-payment">Total Monthly Payment</Label>
              <Input
                id="monthly-payment"
                type="number"
                step="1" // Changed step to 1 for simpler input
                min="0"
                placeholder="e.g., 500"
                value={monthlyCreditCardPayment}
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
                <option value="avalanche">Debt Avalanche (Highest APR First)</option>
                <option value="snowball">Debt Snowball (Lowest Balance First)</option>
              </select>
            </div>
          </div>

          <div className="mb-6">
            <Button
                variant="primary"
                onClick={calculatePayoffPlan}
                className="w-full py-3"
                disabled={calculating || !monthlyCreditCardPayment} // Disable if calculating or no payment entered
             >
              {calculating ? 'Calculating...' : 'Calculate Payoff Plan'}
            </Button>
            {error && (
              <p className="text-red-400 text-sm mt-2 bg-red-900 bg-opacity-30 p-2 rounded">{error}</p>
            )}
          </div>

          {/* Results Display */}
          {results && !error && (
            <div className="mb-6 border-t border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                  Your Payoff Results ({results.payoffStrategy === 'avalanche' ? 'Avalanche Strategy' : 'Snowball Strategy'})
              </h3>
              {/* Summary Boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-700 p-4 rounded text-center">
                  <p className="text-sm text-gray-400 mb-1">Time to Debt Freedom</p>
                  <p className="text-xl font-bold text-accent-green">{formatDate(results.totalMonths)}</p>
                </div>
                <div className="bg-gray-700 p-4 rounded text-center">
                  <p className="text-sm text-gray-400 mb-1">Total Interest Paid</p>
                  <p className="text-xl font-bold text-red-400">{formatCurrency(results.totalInterest)}</p>
                </div>
                 <div className="bg-gray-700 p-4 rounded text-center">
                  <p className="text-sm text-gray-400 mb-1">Total Amount Paid</p>
                  <p className="text-xl font-bold text-white">{formatCurrency(results.totalPaid)}</p>
                </div>
              </div>

              {/* Payoff Details Table */}
              <h4 className="text-md font-semibold text-white mb-3">Payoff Details per Card</h4>
              <div className="overflow-x-auto"> {/* Make table scrollable on small screens */}
                <table className="w-full min-w-[600px] text-sm">
                  <thead className="text-left text-gray-400">
                    <tr>
                      <th className="py-2 px-2 font-medium">Order</th>
                      <th className="py-2 px-2 font-medium">Card</th>
                      <th className="py-2 px-2 text-right font-medium">Initial Balance</th>
                      <th className="py-2 px-2 text-right font-medium">APR (%)</th>
                      <th className="py-2 px-2 text-right font-medium">Months to Payoff</th>
                      <th className="py-2 px-2 text-right font-medium">Interest Paid</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-300">
                    {cards // Use the updated 'cards' state which now contains results
                      .filter(card => card.initialBalance > 0.005) // Only show cards that initially had debt
                      .sort((a, b) => (a.paymentOrder || Infinity) - (b.paymentOrder || Infinity)) // Sort by calculated payment order
                      .map(card => (
                        <tr key={card.id} className="border-b border-gray-700 last:border-b-0 hover:bg-gray-750 transition-colors duration-150">
                          <td className="py-2 px-2 text-center font-medium">{card.paymentOrder || '-'}</td>
                          <td className="py-2 px-2">{card.name}</td>
                          <td className="py-2 px-2 text-right">{formatCurrency(card.initialBalance)}</td>
                          <td className="py-2 px-2 text-right">{card.apr?.toFixed(2)}</td>
                          <td className="py-2 px-2 text-right">{formatDate(card.monthsToPayoff)}</td>
                          <td className="py-2 px-2 text-right">{formatCurrency(card.totalInterest)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Strategy Explanation */}
              <div className="mt-6 bg-gray-700 p-4 rounded">
                 <p className="text-sm text-gray-300">
                   {results.payoffStrategy === 'avalanche' ? (
                     <>
                       <span className="font-medium text-accent-green">Debt Avalanche Strategy:</span>
                       {" "}Targets the card with the highest APR first. This method typically saves the most money on interest over the long run.
                     </>
                   ) : (
                     <>
                       <span className="font-medium text-accent-green">Debt Snowball Strategy:</span>
                       {" "}Targets the card with the smallest balance first, regardless of APR. This provides quicker 'wins' by paying off individual cards faster, which can boost motivation.
                     </>
                   )}
                 </p>
               </div>
            </div>
          )}
        </>
      )} {/* End conditional rendering based on totalInitialDebt */}
    </div>
  );
}