// src/components/layout/Navbar.js
'use client';

import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Helper function to determine active link
  const isActive = (path) => {
    return pathname === path ? 'text-accent-green font-medium' : 'text-gray-300 hover:text-white';
  };

  return (
    <nav className="bg-gray-800 p-4 sticky top-0 z-10">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/dashboard" className="text-white text-xl font-bold">
          PayPulse
        </Link>
        
        {/* Mobile menu button */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
          className="md:hidden text-gray-300 hover:text-white"
        >
          {mobileMenuOpen ? 'Close' : 'Menu'}
        </button>
        
        {/* Desktop navigation */}
        <div className="hidden md:flex space-x-4 items-center">
          <Link href="/dashboard" className={isActive('/dashboard')}>Dashboard</Link>
          <Link href="/accounts" className={isActive('/accounts')}>Accounts</Link>
          <Link href="/credit-cards" className={isActive('/credit-cards')}>Credit Cards</Link>
          <Link href="/income" className={isActive('/income')}>Income</Link>
          <Link href="/bills" className={isActive('/bills')}>Bills</Link>
          <Link href="/transactions" className={isActive('/transactions')}>Transactions</Link>
          <Link href="/debt-payoff" className={isActive('/debt-payoff')}>Debt Payoff</Link>
          <Link href="/settings" className={isActive('/settings')}>Settings</Link>
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="bg-accent-green text-background-dark px-3 py-1 rounded hover:bg-opacity-80 text-sm font-medium disabled:opacity-50 ml-2"
          >
            {isSigningOut ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 pb-2">
          <div className="flex flex-col space-y-2">
            <Link 
              href="/dashboard" 
              className={`${isActive('/dashboard')} px-4 py-2`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link 
              href="/accounts" 
              className={`${isActive('/accounts')} px-4 py-2`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Accounts
            </Link>
            <Link 
              href="/credit-cards" 
              className={`${isActive('/credit-cards')} px-4 py-2`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Credit Cards
            </Link>
            <Link 
              href="/income" 
              className={`${isActive('/income')} px-4 py-2`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Income
            </Link>
            <Link 
              href="/bills" 
              className={`${isActive('/bills')} px-4 py-2`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Bills
            </Link>
            <Link 
              href="/transactions" 
              className={`${isActive('/transactions')} px-4 py-2`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Transactions
            </Link>
            <Link 
              href="/debt-payoff" 
              className={`${isActive('/debt-payoff')} px-4 py-2`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Debt Payoff
            </Link>
            <Link 
              href="/settings" 
              className={`${isActive('/settings')} px-4 py-2`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Settings
            </Link>
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="bg-accent-green text-background-dark px-4 py-2 rounded hover:bg-opacity-80 text-left font-medium disabled:opacity-50"
            >
              {isSigningOut ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}