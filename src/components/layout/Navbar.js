// src/components/layout/Navbar.js
'use client';

import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Navbar() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await supabase.auth.signOut();
      router.refresh();
      // Let middleware handle the redirect
    } catch (error) {
      console.error('Error signing out:', error);
      setIsSigningOut(false);
    }
  };

  return (
    <nav className="bg-gray-800 p-4 sticky top-0 z-10">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/dashboard" className="text-white text-xl font-bold">
          PayPulse
        </Link>
        <div className="space-x-4 flex items-center">
          <Link href="/dashboard" className="text-gray-300 hover:text-white">Dashboard</Link>
          <Link href="/accounts" className="text-gray-300 hover:text-white">Accounts</Link>
          <Link href="/income" className="text-gray-300 hover:text-white">Income</Link>
          <Link href="/bills" className="text-gray-300 hover:text-white">Bills</Link>
          <Link href="/transactions" className="text-gray-300 hover:text-white">Transactions</Link>
          <Link href="/settings" className="text-gray-300 hover:text-white">Settings</Link>
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="bg-accent-green text-background-dark px-3 py-1 rounded hover:bg-opacity-80 text-sm font-medium disabled:opacity-50"
          >
            {isSigningOut ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      </div>
    </nav>
  );
}