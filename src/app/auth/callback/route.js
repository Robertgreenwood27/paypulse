// src/app/auth/callback/route.js
import { createSupabaseServerClient } from '@/lib/supabase/server'; // Use server client
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers'; // Need cookies for server client

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if 'next' is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard'; // Default redirect to dashboard

  if (code) {
    const cookieStore = cookies();
    const supabase = await createSupabaseServerClient(cookieStore); // Pass cookieStore
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // On successful exchange, redirect user to the intended page or dashboard
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // return the user to an error page with instructions
  console.error('Auth Callback Error: Invalid code or session exchange failed.');
  // Redirect to an error page or the login page with an error message
  return NextResponse.redirect(`${origin}/login?message=Could not verify email. Please try logging in.`);
}