import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!supabaseUrl || !supabaseKey || !geminiKey) {
      console.error('[Moderation] Missing configuration');
      return NextResponse.json({ error: 'Config missing' }, { status: 500 });
    }

    const secret = req.headers.get('x-moderation-secret');
    if (secret !== 'ai-indico-secure-moderator') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { record } = await req.json();
    if (!record || !record.id) return NextResponse.json({ error: 'No record' });

    // 1. Instant Bypass for Community/Exclusive
    if (record.community_id || record.is_exclusive) {
      return NextResponse.json({ success: true, bypassed: true });
    }

    const mediaUrl = record.media_urls?.[0];
    const content = record.content || '';

    // 2. Prepare AI Analysis
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Analyze this post.
Content: "${content}"
Instructions: If the text OR the attached media contains nudity, sexual acts, extreme vulgarity, harassment, or prohibited content, respond ONLY with 'REJECT'. Otherwise respond 'APPROVE'.`;

    let result;
    if (mediaUrl) {
      // Analyze Text + Media
      let fetchUrl = mediaUrl;
      if (mediaUrl.toLowerCase().match(/\.(mp4|webm|mov|m4v|ogg)/i)) {
        fetchUrl = mediaUrl.replace('/upload/', '/upload/so_0,f_jpg,w_500/');
      }

      const mediaResp = await fetch(fetchUrl);
      if (!mediaResp.ok) throw new Error('Failed to fetch media');
      const buffer = await mediaResp.arrayBuffer();

      result = await model.generateContent([
        prompt,
        { inlineData: { data: Buffer.from(buffer).toString('base64'), mimeType: 'image/jpeg' } }
      ]);
    } else {
      // Analyze Text Only
      result = await model.generateContent(prompt);
    }

    const text = result.response.text().trim().toUpperCase();
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (text.includes('REJECT')) {
      console.log(`[Moderation] DELETING offensive post ${record.id}`);
      
      // Cleanup Cloudinary
      const { deleteCloudinaryMedia } = await import('@/utils/cloudinary-admin');
      for (const url of record.media_urls || []) {
        await deleteCloudinaryMedia(url).catch(() => {});
      }

      // Cleanup Database
      await supabase.from('posts').delete().eq('id', record.id);
      return NextResponse.json({ action: 'deleted' });
    }

    // Post is safe, already approved by default
    return NextResponse.json({ action: 'kept' });

  } catch (error: any) {
    console.error('[Moderation] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
