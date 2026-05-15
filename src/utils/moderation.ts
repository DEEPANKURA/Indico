import { GoogleGenerativeAI } from '@google/generative-ai';

let genAIInstance: any = null;
function getGenAI() {
  if (!genAIInstance) {
    if (process.env.GEMINI_API_KEY) {
      genAIInstance = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    } else {
      console.error('CRITICAL: GEMINI_API_KEY is not defined in environment variables.');
    }
  }
  return genAIInstance;
}

export async function analyzeContentSafety(content: string, mediaUrl?: string) {
  const genAI = getGenAI();
  if (!genAI) {
    return { is_flagged: false, safety_score: 100, reason: 'AI disabled (missing API key)' };
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ]
    });

    const parts: any[] = [];
    
    // Fetch image data if URL is provided
    if (mediaUrl) {
      try {
        const resp = await fetch(mediaUrl);
        if (resp.ok) {
          const buffer = await resp.arrayBuffer();
          const uint8 = new Uint8Array(buffer);
          let binary = '';
          for (let i = 0; i < uint8.byteLength; i++) {
            binary += String.fromCharCode(uint8[i]);
          }
          const base64 = btoa(binary);

          parts.push({
            inlineData: {
              data: base64,
              mimeType: resp.headers.get('content-type') || 'image/jpeg'
            }
          });
        }
      } catch (e) {
        console.error('Moderation: Failed to fetch media:', e);
      }
    }

    const prompt = `Analyze this social media content for safety.
      Text: "${content.substring(0, 500)}"
      
      CRITICAL RULES:
      1. Flag (is_flagged: true) if there is ANY explicit sexual activity, genitals, pornographic nudity, or highly vulgar content.
      2. Flag if the pose is explicitly sexual, suggestive of pornographic acts, or contains excessive vulgarity.
      3. DO NOT FLAG (is_flagged: false) normal beachwear like bikinis, swimming suits, or fitness wear like shorts/sports bras.
      4. We allow "sexy" and "attractive" content, but NOT "pornographic" or "explicitly sexual" content.
      5. If the content is too vulgar or explicit, it MUST be flagged for deletion.
      
      Return ONLY JSON: { "is_flagged": boolean, "safety_score": number, "reason": string }`;

    parts.unshift(prompt);

    const moderationPromise = model.generateContent(parts);
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('AI Timeout')), 10000));

    const result: any = await Promise.race([moderationPromise, timeoutPromise]);
    const responseText = result.response.text();
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { is_flagged: false, safety_score: 100, reason: 'Invalid AI response' };
  } catch (error: any) {
    console.error('Moderation Error:', error);
    return { is_flagged: false, safety_score: 100, error: error.message };
  }
}
