// src/app/page.js
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client'; // This uses the client-side version

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          router.replace('/dashboard');
        } else {
          router.replace('/login');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    }
    
    checkSession();
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-900 text-white">
      <h1 className="text-4xl font-bold">PayPulse Finance Tracker</h1>
      <p className="mt-4 text-lg text-gray-400">
        {loading ? 'Checking your session...' : 'Redirecting...'}
      </p>
    </main>
  );
}