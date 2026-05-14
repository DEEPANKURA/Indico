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
          parts.push({
            inlineData: {
              data: Buffer.from(buffer).toString('base64'),
              mimeType: resp.headers.get('content-type') || 'image/jpeg'
            }
          });
        }
      } catch (e) {
        console.error('Moderation: Failed to fetch media:', e);
      }
    }

    const prompt = `Analyze this content for safety. 
      Text: "${content.substring(0, 500)}"
      Rules:
      - Flag (is_flagged: true) if there is ANY sexual explicitness, partial/full nudity, suggestive poses, graphic violence, hate speech, or harassment.
      - If the image contains sexually suggestive content, you MUST flag it.
      - Return ONLY JSON: { "is_flagged": boolean, "safety_score": number, "reason": string }`;

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
