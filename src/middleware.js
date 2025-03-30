// src/middleware.js
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(req) {
    const res = NextResponse.next();
    const { pathname } = req.nextUrl;
    
    // Bypass middleware for static assets, API routes, and similar
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.includes('.') ||
        pathname === '/favicon.ico'
    ) {
        return res;
    }

    // Create Supabase client with proper cookie handling
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                get(name) {
                    return req.cookies.get(name)?.value;
                },
                set(name, value, options) {
                    res.cookies.set({ name, value, ...options });
                },
                remove(name, options) {
                    res.cookies.set({ name, value: '', ...options });
                },
            },
        }
    );

    try {
        // Get session with automatic refresh
        const { data: { session } } = await supabase.auth.getSession();
        
        // Define public paths
        const publicPaths = ['/login', '/register', '/auth/callback'];
        
        // Force authenticated users away from login/register pages
        if (session && (pathname === '/login' || pathname === '/register')) {
            return NextResponse.redirect(new URL('/dashboard', req.url));
        }
        
        // Require authentication for protected routes
        const isPublicPath = publicPaths.includes(pathname) || pathname === '/';
        if (!session && !isPublicPath) {
            // Store the original URL to redirect back after login
            const redirectUrl = new URL('/login', req.url);
            redirectUrl.searchParams.set('next', pathname);
            return NextResponse.redirect(redirectUrl);
        }
        
        // Allow the request with potentially refreshed session cookies
        return res;
    } catch (error) {
        console.error('Middleware auth error:', error);
        // On error, continue but don't redirect
        return res;
    }
}

// Simplified matcher pattern
export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};