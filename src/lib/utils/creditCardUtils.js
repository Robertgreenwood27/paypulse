// src/lib/utils/creditCardUtils.js
/**
 * Calculate minimum payment for a credit card
 */
export function calculateMinimumPayment(balance, minPercent = 2, minFixed = 25) {
    if (!balance || balance <= 0) return 0;
    
    let minPayment = 0;
    
    // Calculate percentage-based minimum
    if (minPercent && minPercent > 0) {
      minPayment += (balance * minPercent) / 100;
    }
    
    // Add fixed amount if specified
    if (minFixed && minFixed > 0) {
      minPayment += minFixed;
    }
    
    // Minimum payment can't exceed the balance
    return Math.min(minPayment, balance);
  }
  
  /**
   * Calculate time to pay off credit card
   * @param {number} balance - Current balance
   * @param {number} apr - Annual Percentage Rate (as a percentage, e.g., 18.99)
   * @param {number} payment - Monthly payment amount
   * @returns {Object} - Months to payoff, total interest paid
   */
  export function calculatePayoffTime(balance, apr, payment) {
    if (!balance || balance <= 0 || !payment || payment <= 0) {
      return { months: 0, totalInterest: 0 };
    }
    
    // Convert APR to monthly rate
    const monthlyRate = apr / 100 / 12;
    
    // If payment is less than or equal to monthly interest, debt won't be paid off
    const monthlyInterest = balance * monthlyRate;
    if (payment <= monthlyInterest) {
      return { months: Infinity, totalInterest: Infinity };
    }
    
    let currentBalance = balance;
    let months = 0;
    let totalInterest = 0;
    
    // Simulate monthly payments until balance is paid off
    while (currentBalance > 0 && months < 1000) { // Cap at 1000 months to avoid infinite loops
      months++;
      
      // Calculate interest for this month
      const interest = currentBalance * monthlyRate;
      totalInterest += interest;
      
      // Apply payment
      currentBalance += interest - payment;
      
      // Adjust for final payment
      if (currentBalance < 0) {
        totalInterest += currentBalance; // Reduce interest by overpayment
        currentBalance = 0;
      }
    }
    
    return { months, totalInterest };
  }