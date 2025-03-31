// src/lib/utils/creditCardUtils.js

/**
 * Calculate a more realistic minimum payment for a credit card.
 * Common rules: Higher of $25 OR 1% of balance + monthly interest.
 * Capped at the total balance.
 * @param {number} balance - Current balance
 * @param {number} apr - Annual Percentage Rate (e.g., 18.99)
 * @param {number} minPercent - Minimum percentage of balance (default 1%)
 * @param {number} minFixed - Fixed minimum amount (default $25)
 * @returns {number} - Calculated minimum payment
 */
export function calculateActualMinimumPayment(balance, apr, minPercent = 1, minFixed = 25) {
  if (!balance || balance <= 0) return 0;

  const monthlyRate = apr / 100 / 12;
  const interestThisMonth = balance * monthlyRate;

  // Calculate 1% of balance + interest
  const percentBasedMin = (balance * (minPercent / 100)) + interestThisMonth;

  // Determine minimum: higher of fixed amount or percent-based amount
  const calculatedMin = Math.max(minFixed, percentBasedMin);

  // Minimum payment cannot exceed the outstanding balance
  return Math.min(calculatedMin, balance + interestThisMonth); // Ensure min covers at least interest if possible, but not more than total owed
}

/**
 * Calculate time to pay off a SINGLE credit card with a FIXED payment.
 * NOTE: This is less useful for the snowball/avalanche simulation but kept for potential other uses.
 * @param {number} balance - Current balance
 * @param {number} apr - Annual Percentage Rate (e.g., 18.99)
 * @param {number} payment - Monthly payment amount
 * @returns {Object} - Months to payoff, total interest paid
 */
export function calculatePayoffTime(balance, apr, payment) {
  if (!balance || balance <= 0) {
    return { months: 0, totalInterest: 0 };
  }
   // Handle zero or negative payment which would never pay off debt
  if (!payment || payment <= 0) {
      return { months: Infinity, totalInterest: Infinity };
  }


  const monthlyRate = apr / 100 / 12;

  // If payment is less than or equal to the *first month's* interest, it might never be paid off
  // (This check isn't perfect as balance changes, but catches obvious cases)
  const firstMonthInterest = balance * monthlyRate;
  if (payment <= firstMonthInterest && monthlyRate > 0) {
    // Allow payoff if APR is 0%
    return { months: Infinity, totalInterest: Infinity };
  }

  let currentBalance = balance;
  let months = 0;
  let totalInterest = 0;
  const MAX_MONTHS = 600; // Safety break: 50 years

  while (currentBalance > 0.005 && months < MAX_MONTHS) { // Use a small threshold for floating point issues
    months++;

    const interestForMonth = currentBalance * monthlyRate;
    totalInterest += interestForMonth;
    currentBalance += interestForMonth; // Add interest

    const paymentApplied = Math.min(payment, currentBalance); // Cannot pay more than what's owed
    currentBalance -= paymentApplied; // Apply payment

     // Ensure balance doesn't go negative due to rounding
    if (currentBalance < 0) {
         currentBalance = 0;
    }

  }

   // If loop hit max months, it's effectively infinite
   if (months >= MAX_MONTHS) {
      return { months: Infinity, totalInterest: Infinity };
   }

  // Adjust interest for potential overpayment in the last month
  // This calculation is implicitly handled by summing interestForMonth correctly.
  // If the last payment was less than 'payment', the final currentBalance was slightly > 0 before payment.
  // If the last payment was exactly 'payment', currentBalance was exactly 'payment - interest' before payment.

  return { months, totalInterest };
}