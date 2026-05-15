// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const geminiKey = Deno.env.get('GEMINI_API_KEY') || '';

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing environment variables');
    }

    const { record } = await req.json();
    if (!record || !record.id) {
      return new Response(JSON.stringify({ error: "No record" }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Bypass check
    if (record.community_id || record.is_exclusive) {
      return new Response(JSON.stringify({ success: true, bypassed: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2. AI Moderation
    if (!geminiKey) {
      return new Response(JSON.stringify({ success: true, skipped: 'no_key' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const mediaUrl = record.media_urls?.[0];
    const content = record.content || '';
    const prompt = `Analyze this social media post.
Content: "${content}"
Instructions: Respond ONLY with 'REJECT' if it contains nudity, explicit sexual content, or extreme violence. Otherwise respond 'APPROVE'.`;

    let textResponse = 'APPROVE';

    if (mediaUrl) {
      let fetchUrl = mediaUrl;
      if (mediaUrl.toLowerCase().match(/\.(mp4|webm|mov)/)) {
        fetchUrl = mediaUrl.replace('/upload/', '/upload/so_0,f_jpg,w_500/');
      }

      const res = await fetch(fetchUrl);
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        const uint8 = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < uint8.byteLength; i++) {
          binary += String.fromCharCode(uint8[i]);
        }
        const base64 = btoa(binary);

        const result = await model.generateContent([
          prompt,
          { inlineData: { data: base64, mimeType: 'image/jpeg' } }
        ]);
        const response = await result.response;
        textResponse = response.text().trim().toUpperCase();
      }
    } else {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      textResponse = response.text().trim().toUpperCase();
    }

    if (textResponse.includes('REJECT')) {
      await supabase.from('posts').update({ is_flagged: true, moderation_status: 'flagged' }).eq('id', record.id);
      return new Response(JSON.stringify({ action: 'flagged' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    await supabase.from('posts').update({ moderation_status: 'approved' }).eq('id', record.id);
    return new Response(JSON.stringify({ action: 'approved' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})
