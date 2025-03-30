'use client'; // Forms require client-side interaction

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client'; // Import Supabase client
// No router needed here for sign up if just showing message

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);

    // Supabase registration logic
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // This URL needs to exist to handle the confirmation token
        // It will be handled by middleware/server component later
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
    } else if (data.user) {
      // Check if email confirmation is required (it should be based on our setting)
       if (data.user.identities && data.user.identities.length === 0) {
         // This case might happen in rare scenarios or if email confirmation is off
         setError("Could not confirm user identity.");
       } else {
          setMessage('Registration successful! Please check your email inbox (and spam folder) to confirm your account.');
          // Clear form on success
          setEmail('');
          setPassword('');
          setConfirmPassword('');
       }
    } else {
      // Fallback error
       setError('An unexpected error occurred during registration.');
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background-dark p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-gray-800 p-8 shadow-lg">
        <h2 className="text-center text-3xl font-bold tracking-tight text-white">
          Create your PayPulse account
        </h2>
        {/* Display messages and errors */}
        {message && !error && (
          <div className="rounded-md bg-green-900 bg-opacity-50 p-4 text-center text-sm text-green-200">
            {message}
          </div>
        )}
         {error && (
          <div className="rounded-md bg-red-900 bg-opacity-50 p-4 text-center text-sm text-red-300">
            {error}
          </div>
        )}
        <form onSubmit={handleRegister} className="space-y-6">
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
              Email address
            </label>
            <input
              id="email" name="email" type="email" autoComplete="email" required
              value={email} onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 p-3 text-white shadow-sm focus:border-accent-green focus:ring focus:ring-accent-green focus:ring-opacity-50 disabled:opacity-60"
              placeholder="you@example.com"
            />
          </div>
          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
              Password
            </label>
            <input
              id="password" name="password" type="password" required minLength="6"
              value={password} onChange={(e) => setPassword(e.target.value)}
               disabled={loading}
              className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 p-3 text-white shadow-sm focus:border-accent-green focus:ring focus:ring-accent-green focus:ring-opacity-50 disabled:opacity-60"
              placeholder="•••••••• (min. 6 characters)"
            />
          </div>
          {/* Confirm Password Input */}
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-300">
              Confirm Password
            </label>
            <input
              id="confirm-password" name="confirm-password" type="password" required
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
               disabled={loading}
              className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 p-3 text-white shadow-sm focus:border-accent-green focus:ring focus:ring-accent-green focus:ring-opacity-50 disabled:opacity-60"
              placeholder="••••••••"
            />
          </div>

          <div>
            <button
              type="submit" disabled={loading}
              className="w-full justify-center rounded-md border border-transparent bg-accent-green py-3 px-4 text-sm font-medium text-background-dark shadow-sm hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-accent-green focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </div>
        </form>
        <p className="text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link href="/login" className={`font-medium text-accent-green hover:text-opacity-80 ${loading ? 'pointer-events-none opacity-50' : ''}`}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
