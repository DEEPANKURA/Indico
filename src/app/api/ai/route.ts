import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';


export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt) return NextResponse.json({ error: 'No prompt' }, { status: 400 });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('Missing GEMINI_API_KEY');
      return NextResponse.json({ error: 'Gemini API Key is missing' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Try Flash first (fastest/free), fallback to Pro if needed
    let text = "";
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      text = result.response.text();
    } catch (e) {
      console.warn("Flash model failed, falling back to Pro...", e);
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(prompt);
      text = result.response.text();
    }
    
    if (!text) throw new Error('Empty response from Gemini');

    return NextResponse.json({ result: text });
  } catch (err: any) {
    console.error('AI API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal AI Error' }, { status: 500 });
  }
}
