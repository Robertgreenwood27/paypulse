// src/components/credit-cards/CreditCardSummary.js
const formatCurrency = (amount) => {
    const numericAmount = Number(amount);
    if (isNaN(numericAmount)) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numericAmount);
  };
  
  const formatPercentage = (value) => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    return `${value.toFixed(1)}%`;
  };
  
  export default function CreditCardSummary({ creditCards, paymentStats }) {
    // Calculate total balances, limits, and other stats
    const totalOwed = creditCards.reduce((sum, card) => sum + Number(card.current_balance || 0), 0);
    const totalLimit = creditCards.reduce((sum, card) => sum + Number(card.credit_limit || 0), 0);
    const availableCredit = Math.max(0, totalLimit - totalOwed);
    const overallUtilization = totalLimit > 0 ? (totalOwed / totalLimit) * 100 : 0;
    
    // Get average payment rate (if available)
    const avgPaymentRate = paymentStats?.averagePaymentRate || 0;
    const minPaymentsOnly = paymentStats?.minPaymentsOnly || 0;
    const fullPayments = paymentStats?.fullPayments || 0;
    
    // Get appropriate color for utilization rate
    const getUtilizationColor = (rate) => {
      if (rate >= 75) return 'bg-red-900 text-red-300';
      if (rate >= 30) return 'bg-yellow-900 text-yellow-300';
      return 'bg-green-900 text-green-300';
    };
    
    const utilizationColor = getUtilizationColor(overallUtilization);
  
    return (
      <div className="mb-6 space-y-4">
        <div className="bg-gray-800 rounded-lg p-5 border border-gray-700 shadow">
          <h2 className="text-xl font-semibold text-white mb-4">Credit Card Summary</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3 bg-gray-700 rounded">
              <p className="text-sm text-gray-400">Total Owed</p>
              <p className="text-2xl font-bold text-red-400">{formatCurrency(totalOwed)}</p>
            </div>
            
            <div className="p-3 bg-gray-700 rounded">
              <p className="text-sm text-gray-400">Total Credit Limit</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(totalLimit)}</p>
            </div>
            
            <div className="p-3 bg-gray-700 rounded">
              <p className="text-sm text-gray-400">Available Credit</p>
              <p className="text-2xl font-bold text-green-400">{formatCurrency(availableCredit)}</p>
            </div>
            
            <div className={`p-3 rounded ${utilizationColor}`}>
              <p className="text-sm opacity-80">Overall Utilization</p>
              <p className="text-2xl font-bold">{formatPercentage(overallUtilization)}</p>
            </div>
          </div>
          
          {paymentStats && (
            <div className="mt-6 border-t border-gray-700 pt-4">
              <h3 className="text-lg font-semibold text-white mb-3">Payment Analysis</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-gray-700 rounded">
                  <p className="text-sm text-gray-400">Avg. Payment vs. Statement</p>
                  <p className="text-xl font-bold text-accent-green">{formatPercentage(avgPaymentRate)}</p>
                  <p className="text-xs text-gray-400">Higher is better ({'>'}100% = paying down debt)</p>
                </div>
                
                <div className="p-3 bg-gray-700 rounded">
                  <p className="text-sm text-gray-400">Minimum-Only Payments</p>
                  <p className="text-xl font-bold text-yellow-400">{minPaymentsOnly}</p>
                  <p className="text-xs text-gray-400">Last 6 months</p>
                </div>
                
                <div className="p-3 bg-gray-700 rounded">
                  <p className="text-sm text-gray-400">Full Balance Payments</p>
                  <p className="text-xl font-bold text-green-400">{fullPayments}</p>
                  <p className="text-xs text-gray-400">Last 6 months</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }