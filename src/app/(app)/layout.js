// src/app/(app)/layout.js
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function AppLayout({ children }) {
  try {
    // Double-check authentication at the layout level
    const cookieStore = cookies();
    const supabase = createSupabaseServerClient(cookieStore);
    
    // Use optional chaining to avoid errors if any object is undefined
    const { data, error } = await supabase.auth.getSession();
    const session = data?.session;
    
    if (!session) {
      // Redirect to login if no session
      return redirect('/login?message=Your session has expired.');
    }
    
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
        <Footer />
      </div>
    );
  } catch (error) {
    console.error('Layout error:', error);
    // Fallback to login page on any error
    return redirect('/login?message=An error occurred. Please sign in again.');
  }
}