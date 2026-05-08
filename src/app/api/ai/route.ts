import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt) return NextResponse.json({ error: 'No prompt' }, { status: 400 });

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API Key is missing in environment variables' }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    
    if (!result || !result.response) {
      throw new Error('No response from Gemini API');
    }

    const text = result.response.text();

    return NextResponse.json({ result: text });
  } catch (err: any) {
    console.error('AI API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal AI Error' }, { status: 500 });
  }
}
