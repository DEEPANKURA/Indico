'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Database } from '@/lib/database.types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function createPostAction(
  content: string, 
  mediaUrls: string[] = [], 
  communityId?: string,
  musicInfo?: { url: string; title: string; artist: string; startTime?: number }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    let isFlagged = false;
    let aiSafetyScore = 100;

    if (process.env.GEMINI_API_KEY) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `Analyze this social media post for safety. 
        Note: Swimwear, beachwear, and bikinis are explicitly ALLOWED on this platform and should be considered SAFE and non-suggestive unless there is explicit sexual violence or prohibited adult acts. 
        Respond with only a JSON object: {"isSafe": boolean, "score": number (0-100, where 100 is perfectly safe and 0 is extremely toxic)}. 
        Post: "${content}"`;
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        
        aiSafetyScore = parsed.score;
        isFlagged = !parsed.isSafe || parsed.score < 50;
      } catch (aiErr) {
        console.error("AI Moderation failed", aiErr);
      }
    }

    const { error: insertError } = await supabase.from('posts').insert({
      author_id: user.id,
      content: content.trim(),
      media_urls: mediaUrls,
      ai_safety_score: aiSafetyScore,
      is_flagged: isFlagged,
      community_id: communityId || null,
      music_url: musicInfo?.url || null,
      music_title: musicInfo?.title || null,
      music_artist: musicInfo?.artist || null,
      music_start_time: musicInfo?.startTime || 0
    });

    if (insertError) throw insertError;

    return { success: true, isFlagged };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
