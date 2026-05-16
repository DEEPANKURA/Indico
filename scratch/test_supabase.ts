import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://zmtohgjowcntyhuiuqop.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptdG9oZ2pvd2NudHlodWl1cW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNjY0MDgsImV4cCI6MjA5Mzc0MjQwOH0.xTVMvUa-dEGU5C6lYvLQJ7UUn9nb1x-KKZVvkdyyvPY');

async function test() {
  try {
    const query = supabase.from('profiles').select('id');
    console.log('maybeSingle type:', typeof (query as any).maybeSingle);
    if (typeof (query as any).maybeSingle === 'function') {
      console.log('maybeSingle exists');
    } else {
      console.log('maybeSingle MISSING');
    }
  } catch (e) {
    console.error('Error:', e);
  }
}

test();
