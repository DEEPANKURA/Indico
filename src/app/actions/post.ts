'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function uploadMediaAction(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const file = formData.get('file') as File;
    const caption = formData.get('caption') as string;
    const communityId = formData.get('community_id') as string || undefined;
    
    // Music and Video Editing Info (passed as JSON strings in FormData)
    const musicInfoStr = formData.get('music_info') as string;
    const videoEditingStr = formData.get('video_editing') as string;
    
    const musicInfo = musicInfoStr ? JSON.parse(musicInfoStr) : null;
    const videoEditing = videoEditingStr ? JSON.parse(videoEditingStr) : null;

    if (!file || file.size === 0) return { success: false, error: 'No file provided' };

    const ext = file.name.split('.').pop();
    const filePath = `${user.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, file, { upsert: false });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(filePath);

    // AI Moderation
    let isFlagged = false;
    let aiSafetyScore = 100;

    if (process.env.GEMINI_API_KEY) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `Analyze this social media post for safety. 
        Note: Swimwear, beachwear, and bikinis are explicitly ALLOWED on this platform and should be considered SAFE and non-suggestive unless there is sexual violence or prohibited adult acts. 
        Respond with only a JSON object: {"isSafe": boolean, "score": number (0-100)}. 
        Post: "${caption}"`;
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

    // Create the post
    const { error: postError } = await supabase.from('posts').insert({
      author_id: user.id,
      content: caption.trim(),
      media_urls: [publicUrl],
      ai_safety_score: aiSafetyScore,
      is_flagged: isFlagged,
      community_id: communityId || null,
      music_url: musicInfo?.url || null,
      music_title: musicInfo?.title || null,
      music_artist: musicInfo?.artist || null,
      music_start_time: musicInfo?.startTime || 0,
      music_volume: musicInfo?.volume ?? 0.5,
      video_volume: videoEditing?.volume ?? 1.0,
      video_trim_start: videoEditing?.trimStart ?? 0,
      video_trim_end: videoEditing?.trimEnd ?? null
    } as any);

    if (postError) throw postError;

    revalidatePath('/');
    revalidatePath('/profile');
    if (communityId) revalidatePath(`/communities/${communityId}`);
    
    return { success: true, isFlagged };
  } catch (err: any) {
    console.error('Upload Media Error:', err);
    return { success: false, error: err.message };
  }
}

export async function createPostAction(
  content: string, 
  mediaUrls: string[] = [], 
  communityId?: string,
  musicInfo?: { url: string; title: string; artist: string; startTime?: number; volume?: number },
  videoEditing?: { volume?: number; trimStart?: number; trimEnd?: number }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    let isFlagged = false;
    let aiSafetyScore = 100;

    if (process.env.GEMINI_API_KEY) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `Analyze this social media post for safety. Post: "${content}"`;
        const result = await model.generateContent(prompt);
        const parsed = JSON.parse(result.response.text().replace(/```json/g, '').replace(/```/g, '').trim());
        aiSafetyScore = parsed.score;
        isFlagged = !parsed.isSafe || parsed.score < 50;
      } catch (aiErr) {}
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
      music_start_time: musicInfo?.startTime || 0,
      music_volume: musicInfo?.volume ?? 0.5,
      video_volume: videoEditing?.volume ?? 1.0,
      video_trim_start: videoEditing?.trimStart ?? 0,
      video_trim_end: videoEditing?.trimEnd ?? null
    } as any);

    if (insertError) throw insertError;
    revalidatePath('/');
    return { success: true, isFlagged };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
