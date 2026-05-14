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

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Instant Bypass for Community/Exclusive
    if (record.community_id || record.is_exclusive) {
      return NextResponse.json({ success: true, bypassed: true });
    }

    // 2. Resilience: If Gemini Key is missing, don't fail, just allow
    if (!geminiKey) {
      console.warn('[Moderation] Gemini Key missing, skipping AI check');
      return NextResponse.json({ success: true, skipped: true });
    }

    const mediaUrl = record.media_urls?.[0];
    const content = record.content || '';

    // 3. Prepare AI Analysis
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Analyze this post.
Content: "${content}"
Instructions: If the text OR the attached media contains nudity, sexual acts, extreme vulgarity, harassment, or prohibited content, respond ONLY with 'REJECT'. Otherwise respond 'APPROVE'.`;

    let result;
    try {
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
    } catch (aiError: any) {
      console.error('[Moderation] AI Error:', aiError.message);
      return NextResponse.json({ success: true, ai_error: aiError.message });
    }

    const text = result.response.text().trim().toUpperCase();

    if (text.includes('REJECT')) {
      console.log(`[Moderation] REPORTING/FLAGGING offensive post ${record.id}`);
      
      // Update as flagged but DON'T delete and DON'T change from approved
      // This fulfills "no moderation, only report"
      await supabase.from('posts').update({ 
        is_flagged: true,
        ai_confidence_score: 99.9 // Mark as high confidence rejection for reporting
      }).eq('id', record.id);
      
      return NextResponse.json({ action: 'flagged' });
    }

    return NextResponse.json({ action: 'kept' });

  } catch (error: any) {
    console.error('[Moderation] Critical Error:', error.message);
    // Even on critical error, return 200 to Supabase pg_net to avoid retries/noise
    return NextResponse.json({ error: error.message }, { status: 200 });
  }
}
