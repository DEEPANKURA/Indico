'use client';

import { useEffect } from 'react';
import { generateE2EEKeys, getMyE2EEKeys, onboardSubscribers } from '@/utils/e2ee';
import { createClient } from '@/utils/supabase/client';
import { updatePublicKeyAction } from '@/app/actions/profile';

export default function E2EEInitializer() {
  const supabase = createClient();

  useEffect(() => {
    const initE2EE = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let keys = getMyE2EEKeys();
      
      // If no keys locally, generate them
      if (!keys) {
        console.log('[E2EE] No local keys found, generating new pair...');
        keys = await generateE2EEKeys();
      }

      // Check if public key is in database
      const { data: profile } = await supabase
        .from('profiles')
        .select('public_key')
        .eq('id', user.id)
        .maybeSingle();

      if (keys && (!profile || profile.public_key !== keys.publicKey)) {
        console.log('[E2EE] Syncing public key to database...');
        await updatePublicKeyAction(keys.publicKey);
      }

      // Onboard subscribers if this user is a creator
      await onboardSubscribers(supabase);
    };

    initE2EE();
  }, [supabase]);

  return null;
}
