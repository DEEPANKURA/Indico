'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Loader2, User, Bot, Camera, Image as ImageIcon, Wand2, Hash, Lightbulb, BarChart2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function AIChatPage() {
  const supabase = createClient();
  const [messages, setMessages] = useState<{role: 'user' | 'assistant' | 'system', content: string, type?: 'image' | 'text'}[]>([
    { role: 'assistant', content: "Hi! I'm your Indico Creator Assistant. I've analyzed your profile and I'm ready to help you grow. Want some post ideas, captions, or a new AI-generated image?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      const { data: posts } = await supabase.from('posts').select('content, like_count').eq('author_id', user.id).limit(5).order('created_at', { ascending: false });
      
      setProfile(profile);
      setRecentPosts(posts || []);
    };
    fetchData();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (customPrompt?: string) => {
    const text = customPrompt || input;
    if (!text.trim()) return;

    const userMessage = { role: 'user' as const, content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Check if it's an image generation request
      if (text.toLowerCase().includes('generate image') || text.toLowerCase().includes('create an image')) {
        const prompt = text.replace(/generate image|create an image/gi, '').trim();
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&seed=${Date.now()}`;
        
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `I've generated an image based on your request: "${prompt}"`,
          type: 'image' as const 
        }, {
          role: 'assistant',
          content: imageUrl,
          type: 'image' as const
        }]);
      } else {
        // Build context for Gemini
        const context = `
          You are an AI assistant for a creator on the Indico social platform.
          Creator Profile: ${profile?.full_name} (@${profile?.username})
          Bio: ${profile?.bio || 'No bio'}
          Stats: ${profile?.followers_count} followers, ${profile?.following_count} following.
          Recent Posts: ${recentPosts.map(p => p.content).join(' | ')}
          
          Goal: Help the creator with ideas, captions, tags, and growth strategies.
          Be encouraging, trendy, and specific.
        `;

        const res = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: context + "\n\nUser: " + text }),
        });
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', content: data.result || "Sorry, I couldn't process that." }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Error connecting to AI service." }]);
    }
    setLoading(false);
  };

  const quickActions = [
    { label: 'Viral Caption', icon: Wand2, prompt: 'Generate a viral caption for my next post about building a community' },
    { label: 'Content Ideas', icon: Lightbulb, prompt: 'Give me 3 content ideas based on my profile' },
    { label: 'Suggest Tags', icon: Hash, prompt: 'Suggest trending tags for my recent posts' },
    { label: 'Generate Image', icon: ImageIcon, prompt: 'Generate image of a futuristic neon city' },
  ];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '20px 0', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-neon))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles size={24} color="white" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.2rem', fontWeight: '900', margin: 0 }}>Indico AI Assistant</h1>
          <div style={{ fontSize: '0.8rem', color: 'var(--accent-neon)', fontWeight: 'bold' }}>ONLINE • ANALYZING PROFILE</div>
        </div>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '20px' }} className="no-scrollbar">
        {messages.map((msg, i) => (
          <div key={i} style={{ 
            display: 'flex', 
            gap: '12px', 
            flexDirection: (msg.role === 'user' ? 'row-reverse' : 'row') as any,
            alignItems: 'flex-start',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <div style={{ 
              width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
              background: msg.role === 'user' ? 'var(--accent-secondary)' : 'var(--bg-glass)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-light)'
            }}>
              {msg.role === 'user' ? <User size={18} /> : <Bot size={18} className="text-gradient" />}
            </div>
            
            <div style={{ 
              maxWidth: '80%', 
              padding: '14px 18px', 
              borderRadius: (msg.role === 'user' ? '20px 4px 20px 20px' : '4px 20px 20px 20px') as any,
              background: (msg.role === 'user' ? 'var(--accent-primary)' : 'var(--bg-secondary)') as any,
              color: 'white',
              fontSize: '0.95rem',
              lineHeight: '1.6',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: msg.role === 'assistant' ? '1px solid var(--border-light)' : 'none'
            }}>
              {msg.type === 'image' && msg.content.startsWith('http') ? (
                <div style={{ borderRadius: '12px', overflow: 'hidden', marginTop: '8px' }}>
                  <img src={msg.content} style={{ width: '100%', display: 'block' }} alt="AI Generated" />
                  <a href={msg.content} download target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '10px', background: 'rgba(255,255,255,0.1)', textAlign: 'center', color: 'white', textDecoration: 'none', fontSize: '0.8rem' }}>Download Image</a>
                </div>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={18} className="animate-pulse" />
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Thinking...</div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '10px 0' }} className="no-scrollbar">
        {quickActions.map((action, i) => (
          <button 
            key={i} 
            onClick={() => handleSend(action.prompt)}
            style={{ 
              padding: '8px 16px', borderRadius: '20px', background: 'var(--bg-glass)', 
              border: '1px solid var(--border-light)', color: 'white', whiteSpace: 'nowrap',
              fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <action.icon size={14} /> {action.label}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div style={{ padding: '20px 0 40px' }}>
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} style={{ position: 'relative' }}>
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything or say 'Generate image of...'"
            style={{ 
              width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)',
              borderRadius: '24px', padding: '16px 50px 16px 20px', color: 'white', outline: 'none',
              fontSize: '1rem'
            }}
          />
          <button 
            type="submit" 
            disabled={loading || !input.trim()}
            style={{ 
              position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
              background: 'var(--accent-primary)', border: 'none', color: 'white',
              width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', opacity: input.trim() ? 1 : 0.5
            }}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
