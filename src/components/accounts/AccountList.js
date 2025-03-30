// src/components/accounts/AccountList.js
// This can be a Server Component as it just displays data passed to it

import AccountCard from './AccountCard'; // We'll create this next

export default function AccountList({ accounts }) {
  if (!accounts || accounts.length === 0) {
    return (
      <div className="text-center text-gray-400 py-10 border-2 border-dashed border-gray-600 rounded-lg">
        <p className="text-lg">No accounts found.</p>
        <p>Click "Add Account" to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {accounts.map((account) => (
        <AccountCard key={account.id} account={account} />
      ))}
    </div>
  );
}
