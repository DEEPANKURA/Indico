import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/lib/database.types';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://zmtohgjowcntyhuiuqop.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptdG9oZ2pvd2NudHlodWl1cW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNjY0MDgsImV4cCI6MjA5Mzc0MjQwOH0.xTVMvUa-dEGU5C6lYvLQJ7UUn9nb1x-KKZVvkdyyvPY'
  );
}
