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

export async function uploadMediaAction(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const file = formData.get('file') as File;
    const content = formData.get('caption') as string; // User calls it caption in frontend but it maps to content in DB
    const communityId = formData.get('community_id') as string;
    const musicInfoStr = formData.get('music_info') as string;
    const videoEditingStr = formData.get('video_editing') as string;
    const tagsStr = formData.get('tags') as string;
    const mentionsStr = formData.get('mentions') as string;
    const overlaysStr = formData.get('overlays') as string;

    const tags = tagsStr ? JSON.parse(tagsStr) : [];
    const mentions = mentionsStr ? JSON.parse(mentionsStr) : [];
    const overlays = overlaysStr ? JSON.parse(overlaysStr) : null;
    const musicInfo = musicInfoStr ? JSON.parse(musicInfoStr) : null;
    const videoEditing = videoEditingStr ? JSON.parse(videoEditingStr) : null;

    if (!file) return { success: false, error: 'No file provided' };

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);

    // AI Safety Check
    let isFlagged = false;
    let safetyScore = 100;
    let confidenceScore = 1.0;
    
    const genAI = getGenAI();
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent([
          `Check this social media post for safety. Content: "${content}". Media URL: ${publicUrl}. ` +
          `Return JSON: { "is_flagged": boolean, "safety_score": number(0-100), "confidence": number(0-1) }`
        ]);
        const responseText = result.response.text();
        const parsed = JSON.parse(responseText.replace(/```json/g, '').replace(/```/g, '').trim());
        isFlagged = parsed.is_flagged;
        safetyScore = parsed.safety_score;
        confidenceScore = parsed.confidence;
      } catch (err) {
        console.error('AI Moderation failed:', err);
      }
    }

    const { error: dbError } = await supabase.from('posts').insert({
      author_id: user.id,
      content: content,
      is_flagged: isFlagged,
      ai_safety_score: safetyScore,
      ai_confidence_score: confidenceScore,
      media_urls: [publicUrl],
      community_id: communityId || null,
      music_url: musicInfo?.url || null,
      music_title: musicInfo?.title || null,
      music_artist: musicInfo?.artist || null,
      music_start_time: musicInfo?.startTime || 0,
      music_volume: musicInfo?.volume ?? 0.5,
      video_volume: videoEditing?.volume ?? 1.0,
      video_trim_start: videoEditing?.trimStart ?? 0,
      video_trim_end: videoEditing?.trimEnd ?? null,
      tags: tags,
      mentions: mentions,
      overlays: overlays
    } as any);

    if (dbError) throw dbError;

    revalidatePath('/');
    revalidatePath('/studio');
    revalidatePath('/profile');

    return { success: true, isFlagged };
  } catch (error: any) {
    console.error('Upload error:', error);
    return { success: false, error: error.message };
  }
}

export async function createPostAction(
  content: string, 
  mediaUrls: string[], 
  communityId?: string,
  musicInfo?: { url: string; title: string; artist: string; startTime?: number; volume?: number },
  videoEditing?: { volume?: number; trimStart?: number; trimEnd?: number }
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
        const parsed = JSON.parse(responseText.replace(/```json/g, '').replace(/```/g, '').trim());
        isFlagged = parsed.is_flagged;
        safetyScore = parsed.safety_score;
        confidenceScore = parsed.confidence;
      } catch (err) {
        console.error('AI Moderation failed:', err);
      }
    }

    const { error: dbError } = await supabase.from('posts').insert({
      author_id: user.id,
      content: content,
      is_flagged: isFlagged,
      ai_safety_score: safetyScore,
      ai_confidence_score: confidenceScore,
      media_urls: mediaUrls,
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

    if (dbError) throw dbError;
    revalidatePath('/');
    return { success: true, isFlagged };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
