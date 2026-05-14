'use client';

import { useEffect } from 'react';

export default function ChunkErrorHandler() {
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      // Check if the error is a "Loading chunk X failed" error
      const isChunkError = 
        error.message?.includes('Loading chunk') || 
        error.message?.includes('Failed to load chunk') ||
        (error as any).reason?.message?.includes('Loading chunk');

      if (isChunkError) {
        console.warn('Chunk load error detected. Refreshing page to sync with latest deployment...');
        // Only reload once to avoid infinite loops if it's a persistent error
        const lastReload = sessionStorage.getItem('last_chunk_error_reload');
        const now = Date.now();
        
        if (!lastReload || now - parseInt(lastReload) > 30000) {
          sessionStorage.setItem('last_chunk_error_reload', now.toString());
          window.location.reload();
        }
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError as any);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError as any);
    };
  }, []);

  return null;
}
