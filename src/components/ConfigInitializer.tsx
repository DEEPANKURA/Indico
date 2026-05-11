'use client';

import { setSupabaseConfig } from '@/utils/supabase/config';

export default function ConfigInitializer({ url, anonKey }: { url: string, anonKey: string }) {
  // We set it immediately during render to avoid race conditions
  setSupabaseConfig(url, anonKey);
  
  return null;
}
