// src/components/credit-cards/CreditCardList.js
import AccountCard from '@/components/accounts/AccountCard';

export default function CreditCardList({ creditCards }) {
  if (!creditCards || creditCards.length === 0) {
    return (
      <div className="text-center text-gray-400 py-10 border-2 border-dashed border-gray-600 rounded-lg">
        <p className="text-lg">No credit cards found.</p>
        <p>Click "Add Account" to add your first credit card.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {creditCards.map((card) => (
        <AccountCard key={card.id} account={card} />
      ))}
    </div>
  );
}
