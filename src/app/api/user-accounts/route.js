// src/app/api/user-accounts/route.js
import { createSupabaseServerClient } from '@/lib/supabase/server'; // Use server client for secure access
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request) {
    const cookieStore = cookies();
    // Pass cookieStore explicitly IF needed by your createSupabaseServerClient setup for GET requests
    // Depending on Supabase/SSR setup, it might read automatically for GET.
    const supabase = createSupabaseServerClient(); // Assuming it reads cookies automatically or via middleware

    // Verify user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
        console.error("API /user-accounts: Auth error", sessionError);
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Fetch accounts for the logged-in user (RLS handles filtering)
    const { data: accounts, error: dbError } = await supabase
        .from('accounts')
        .select('id, name, type') // Select only necessary fields for dropdown
        .order('name', { ascending: true });

    if (dbError) {
        console.error("API /user-accounts: DB error", dbError);
        return NextResponse.json({ error: 'Failed to fetch accounts', details: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ accounts: accounts || [] });
}