'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize only when needed to avoid build-time issues with missing env vars
let genAIInstance: any = null;
function getGenAI() {
  if (!genAIInstance && process.env.GEMINI_API_KEY) {
    genAIInstance = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAIInstance;
}

export async function createPostAction(
  content: string, 
  mediaUrls: string[], 
  communityId?: string,
  musicInfo?: { url: string; title: string; artist: string; startTime?: number; volume?: number },
  videoEditing?: { volume?: number; trimStart?: number; trimEnd?: number },
  tags: string[] = [],
  mentions: string[] = [],
  overlays: any = null
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const mediaUrl = mediaUrls?.[0] || '';

    // AI Safety Check
    let isFlagged = false;
    let safetyScore = 100;
    let confidenceScore = 1.0;

    const genAI = getGenAI();
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent([
          `Check this social media post for safety. Content: "${content}". Media URL: ${mediaUrl}. ` +
          `Return JSON: { "is_flagged": boolean, "safety_score": number(0-100), "confidence": number(0-1) }`
        ]);
        const responseText = result.response.text();
        
        // Robust JSON extraction
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          isFlagged = parsed.is_flagged ?? false;
          safetyScore = parsed.safety_score ?? 100;
          confidenceScore = parsed.confidence ?? 1.0;
        }
      } catch (err) {
        console.error('AI Moderation failed:', err);
      }
    }

    try {
      console.log('Inserting post with:', { author_id: user.id, community_id: communityId, is_flagged: isFlagged });
    
      const { error: dbError } = await supabase.from('posts').insert({
        author_id: user.id,
        content,
        media_urls: mediaUrls,
        moderation_status: isFlagged ? 'flagged' : 'approved',
        ai_confidence_score: 0.9,
        ai_safety_score: isFlagged ? 0 : 100,
        is_flagged: isFlagged,
        community_id: communityId || null,
        music_url: musicInfo?.url,
        music_title: musicInfo?.title,
        music_artist: musicInfo?.artist,
        music_start_time: musicInfo?.startTime || 0,
        music_volume: musicInfo?.volume ?? 0.5,
        video_volume: videoEditing?.volume ?? 1.0,
        video_trim_start: videoEditing?.trimStart ?? 0,
        video_trim_end: videoEditing?.trimEnd ?? null,
        tags: tags,
        mentions: mentions,
        overlays: overlays
      } as any);

      if (dbError) {
        console.error('Database insertion error:', dbError);
        return { success: false, error: `Database error: ${dbError.message}` };
      }
    } catch (dbErr: any) {
      console.error('Database Error:', dbErr);
      return { success: false, error: `Database Error: ${dbErr.message || 'Failed to save'}` };
    }

    revalidatePath('/');
    revalidatePath('/studio');
    revalidatePath('/profile');
    return { success: true, isFlagged };
  } catch (error: any) {
    console.error('Create post error:', error);
    return { success: false, error: error.message };
  }
}

export async function deletePostAction(postId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('author_id', user.id);

    if (error) return { success: false, error: error.message };
    
    revalidatePath('/');
    revalidatePath('/studio');
    revalidatePath('/profile');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
