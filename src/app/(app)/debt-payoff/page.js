// src/app/(app)/debt-payoff/page.js
import { getAccounts } from '@/lib/services/accountService';
import DebtPayoffCalculatorClient from '@/components/credit-cards/DebtPayoffCalculatorClient';

export const dynamic = 'force-dynamic';

export default async function DebtPayoffPage() {
  const { accounts, error } = await getAccounts();
  const creditCards = accounts.filter(account => account.type === 'credit card');

  // Pass the server-fetched data to the client component
  return <DebtPayoffCalculatorClient creditCards={creditCards} initialError={error} />;
}