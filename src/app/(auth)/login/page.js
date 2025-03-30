// src/app/login/page.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get next redirect path from URL params
  const nextPath = searchParams.get('next') || '/dashboard';
  
  // Check for message in URL
  useEffect(() => {
    const urlMessage = searchParams.get('message');
    if (urlMessage) {
      setMessage(urlMessage);
    }
  }, [searchParams]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        setError(signInError.message);
      } else {
        // Successful login
        router.push(nextPath);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background-dark p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-gray-800 p-8 shadow-lg">
        <h2 className="text-center text-3xl font-bold tracking-tight text-white">
          Sign in to PayPulse
        </h2>
        
        {message && (
          <div className="rounded-md bg-blue-900 bg-opacity-50 p-4 text-center text-sm text-blue-200">
            {message}
          </div>
        )}
        
        {error && (
          <div className="rounded-md bg-red-900 bg-opacity-50 p-4 text-center text-sm text-red-300">
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Form fields remain the same */}
          {/* ... */}
        </form>
        
        <p className="text-center text-sm text-gray-400">
          Don't have an account?{' '}
          <Link href="/register" className={`font-medium text-accent-green hover:text-opacity-80 ${loading ? 'pointer-events-none opacity-50' : ''}`}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}