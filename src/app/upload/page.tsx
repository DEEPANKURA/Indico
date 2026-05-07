import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import UploadClient from './UploadClient';

export default async function UploadPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');
  return <UploadClient />;
}
