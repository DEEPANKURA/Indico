import { createClient } from "@/utils/supabase/server";
import HomeClient from "./HomeClient";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = await createClient();
  
  // Pre-fetch initial data on the server
  const { data: { user } } = await supabase.auth.getUser();
  
  // Default to 'viral' feed for the initial load
  const { data: viralPosts, error } = await (supabase.rpc as any)('get_viral_feed', { 
    limit_count: 20 
  });

  if (error) {
    console.error('Error fetching initial viral feed:', error);
  }

  return (
    <HomeClient 
      initialPosts={viralPosts || []} 
      initialUser={user} 
    />
  );
}
