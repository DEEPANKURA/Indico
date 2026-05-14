'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function RealtimeRefresh() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Initial refresh to clear any stale cache on mount (back navigation)
    router.refresh();

    const channel = supabase
      .channel('global_posts_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        router.refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router, supabase]);

  return null;
}
