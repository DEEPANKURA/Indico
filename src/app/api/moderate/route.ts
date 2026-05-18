import { createClient } from '@supabase/supabase-js';
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
    const prompt = `Analyze this post.
Content: "${content}"
Instructions: If the text OR the attached media contains nudity, sexual acts, extreme vulgarity, harassment, or prohibited content, respond ONLY with 'REJECT'. Otherwise respond 'APPROVE'.`;

    const parts: any[] = [];
    
    if (mediaUrl) {
      let fetchUrl = mediaUrl;
      if (mediaUrl.toLowerCase().match(/\.(mp4|webm|mov|m4v|ogg)/i)) {
        fetchUrl = mediaUrl.replace('/upload/', '/upload/so_0,f_jpg,w_500/');
      }

      const mediaResp = await fetch(fetchUrl);
      if (!mediaResp.ok) throw new Error('Failed to fetch media');
      const buffer = await mediaResp.arrayBuffer();
      
      const uint8 = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < uint8.byteLength; i++) {
        binary += String.fromCharCode(uint8[i]);
      }
      const base64 = btoa(binary);

      parts.push({
        inlineData: {
          data: base64,
          mimeType: 'image/jpeg'
        }
      });
    }

    parts.unshift({ text: prompt });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
    
    const requestBody = {
      contents: [
        {
          parts: parts
        }
      ],
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ]
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!res.ok) {
      throw new Error(`Gemini API HTTP ${res.status}`);
    }

    const data = await res.json();
    const text = (data?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim().toUpperCase();

    if (text.includes('REJECT')) {
      console.log(`[Moderation] REPORTING/FLAGGING offensive post ${record.id}`);
      
      await supabase.from('posts').update({ 
        is_flagged: true,
        ai_confidence_score: 99.9
      }).eq('id', record.id);
      
      return NextResponse.json({ action: 'flagged' });
    }

    return NextResponse.json({ action: 'kept' });

  } catch (error: any) {
    console.error('[Moderation] Critical Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 200 });
  }
}
