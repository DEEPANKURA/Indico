'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function RealtimeRefresh() {
  const router = useRouter();
  const supabaseRef = useRef<any>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  if (!supabaseRef.current) {
    supabaseRef.current = createClient();
  }

  useEffect(() => {
    const supabase = supabaseRef.current;
    
    const channel = supabase
      .channel('global-refresh')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
        },
        () => {
          // Debounce refresh to avoid Cloudflare CPU limits (Error 1101)
          if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
          
          timeoutIdRef.current = setTimeout(() => {
            console.log('[Realtime] Data changed, refreshing feed...');
            router.refresh();
          }, 800); // 800ms debounce
        }
      )
      .subscribe();

    return () => {
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
