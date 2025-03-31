// src/components/credit-cards/DebtPayoffCalculatorClient.js
'use client';

import { useState } from 'react';
import DebtPayoffCalculator from './DebtPayoffCalculator';

export default function DebtPayoffCalculatorClient({ creditCards, initialError }) {
  const [error, setError] = useState(initialError);

  if (error?.message === 'User not authenticated') {
    return (
      <div className="text-center text-red-400 py-10">
        <p>Authentication required to view this page.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Debt Payoff Calculator</h1>
        <p className="text-gray-400 mt-2">
          Calculate how long it will take to pay off your credit card debt and explore different payment strategies.
        </p>
      </div>

      {error && (
        <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded mb-4" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline ml-2"> Failed to load credit card data. ({error.message})</span>
        </div>
      )}

      {!error && <DebtPayoffCalculator creditCards={creditCards} />}

      {!error && creditCards.length === 0 && (
        <div className="text-center text-gray-400 py-10 border-2 border-dashed border-gray-600 rounded-lg">
          <p className="text-lg">No credit cards found.</p>
          <p className="mt-2">Add credit card accounts to use the debt payoff calculator.</p>
        </div>
      )}
    </div>
  );
}