import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!supabaseUrl || !supabaseKey || !geminiKey) {
      console.error('[Moderation] Missing configuration:', { 
        hasUrl: !!supabaseUrl, 
        hasKey: !!supabaseKey, 
        hasGemini: !!geminiKey 
      });
      return NextResponse.json({ error: 'Moderation service misconfigured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const genAI = new GoogleGenerativeAI(geminiKey);

    const { record } = await req.json();
    
    if (!record || !record.id) {
      return NextResponse.json({ error: 'No record' }, { status: 400 });
    }

    const postId = record.id;
    const content = record.content || '';
    const mediaUrl = record.media_urls?.[0];

    console.log(`[Moderation] Processing post: ${postId}`);

    if (!mediaUrl) {
      // Auto-approve text-only for now, or you could add text moderation here
      await supabase.from('posts').update({ moderation_status: 'approved' }).eq('id', postId);
      return NextResponse.json({ success: true, action: 'approved-text' });
    }

    // 1. Fetch the media
    const mediaResp = await fetch(mediaUrl);
    if (!mediaResp.ok) {
      throw new Error(`Failed to fetch media: ${mediaResp.statusText}`);
    }
    const mediaBuffer = await mediaResp.arrayBuffer();

    // 2. Call Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Analyze this social media post for safety.
      Post Content: "${content}"
      
      CRITICAL SAFETY RULES:
      - Flag (is_flagged: true) if you see: explicit sexual acts, genitals, exposed breasts (excluding breastfeeding), or highly vulgar/pornographic content.
      - DO NOT FLAG: Normal beachwear (bikinis), fitness wear (shorts/sports bras), or artistic nudity that isn't pornographic.
      - We allow "sexy" and "attractive" content, but NOT "pornographic" or "explicitly sexual" content.
      - If it is too vulgar or explicit, it MUST be deleted.
      
      Return ONLY JSON format:
      {
        "is_flagged": boolean,
        "reason": "string describing why if flagged"
      }`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: Buffer.from(mediaBuffer).toString('base64'),
          mimeType: mediaResp.headers.get('content-type') || 'image/jpeg'
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const moderation = jsonMatch ? JSON.parse(jsonMatch[0]) : { is_flagged: false };

    console.log(`[Moderation] AI Result for ${postId}:`, moderation);

    if (moderation.is_flagged) {
      // User requested: "ai auto delete it"
      await supabase.from('posts').delete().eq('id', postId);
      console.log(`[Moderation] Post ${postId} DELETED due to safety violation: ${moderation.reason}`);
      return NextResponse.json({ success: true, action: 'deleted', reason: moderation.reason });
    } else {
      await supabase.from('posts').update({ moderation_status: 'approved' }).eq('id', postId);
      console.log(`[Moderation] Post ${postId} APPROVED`);
      return NextResponse.json({ success: true, action: 'approved' });
    }

  } catch (error: any) {
    console.error('[Moderation] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
