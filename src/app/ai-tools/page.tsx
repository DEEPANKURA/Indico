'use client';

import { useState } from 'react';
import { Sparkles, Shield, Wand2, Hash, FileText, BarChart2, Loader2 } from 'lucide-react';

const tools = [
  { id: 'caption', icon: FileText, label: 'Caption Generator', desc: 'Generate viral captions for your posts', color: '#8b5cf6', prompt: 'Generate 3 viral social media captions for a post about: ' },
  { id: 'hashtags', icon: Hash, label: 'Hashtag Suggester', desc: 'Get trending hashtags for your content', color: '#06b6d4', prompt: 'Suggest 15 trending hashtags for content about: ' },
  { id: 'hook', icon: Wand2, label: 'Hook Writer', desc: 'Write scroll-stopping opening lines', color: '#ec4899', prompt: 'Write 3 scroll-stopping hooks for a post about: ' },
  { id: 'moderation', icon: Shield, label: 'Content Checker', desc: 'Check if your content is safe to post', color: '#10b981', prompt: 'Analyze this content for safety and community guidelines compliance: ' },
  { id: 'analytics', icon: BarChart2, label: 'Growth Advisor', desc: 'Get personalized growth tips', color: '#f97316', prompt: 'Give me 5 specific growth tips for a creator who posts about: ' },
];

export default function AIToolsPage() {
  const [activeTool, setActiveTool] = useState(tools[0]);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setOutput('');
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: activeTool.prompt + input }),
      });
      const data = await res.json();
      setOutput(data.result || 'No result generated.');
    } catch {
      setOutput('Error connecting to AI. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingTop: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <Sparkles size={28} style={{ color: 'var(--accent-neon)' }} />
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>AI Tools</h1>
        <span style={{ background: 'rgba(0,255,200,0.1)', color: 'var(--accent-neon)', fontSize: '0.75rem', fontWeight: '700', padding: '3px 10px', borderRadius: '20px' }}>Powered by Gemini</span>
      </div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Supercharge your content with AI</p>

      {/* Tool selector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '24px' }}>
        {tools.map((tool) => (
          <button key={tool.id} onClick={() => { setActiveTool(tool); setOutput(''); setInput(''); }} style={{
            padding: '14px', borderRadius: '14px', border: `1px solid ${activeTool.id === tool.id ? tool.color : 'var(--border-light)'}`,
            background: activeTool.id === tool.id ? `${tool.color}15` : 'var(--bg-glass)',
            cursor: 'pointer', textAlign: 'left', display: 'flex', gap: '10px', alignItems: 'center',
            color: 'white', transition: 'all 0.2s'
          }}>
            <tool.icon size={20} style={{ color: tool.color, flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>{tool.label}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{tool.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="glass-card" style={{ padding: '20px', borderRadius: '16px', marginBottom: '16px' }}>
        <label style={{ display: 'block', fontWeight: '700', marginBottom: '10px', color: activeTool.color }}>
          {activeTool.label}
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Describe your content topic...`}
          style={{
            width: '100%', padding: '12px', borderRadius: '10px', minHeight: '90px',
            background: 'var(--bg-glass)', border: '1px solid var(--border-light)',
            color: 'white', outline: 'none', resize: 'none', fontFamily: 'inherit',
            fontSize: '0.95rem', boxSizing: 'border-box', marginBottom: '12px'
          }}
        />
        <button
          onClick={handleGenerate}
          disabled={loading || !input.trim()}
          style={{
            width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
            background: `linear-gradient(135deg, ${activeTool.color}, ${activeTool.color}99)`,
            color: 'white', fontWeight: '700', cursor: input.trim() ? 'pointer' : 'not-allowed',
            opacity: input.trim() ? 1 : 0.6,
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
          }}
        >
          {loading ? <><Loader2 size={18} className="animate-spin" /> Generating...</> : <><Sparkles size={18} /> Generate</>}
        </button>
      </div>

      {/* Output */}
      {output && (
        <div className="glass-card animate-fade-in" style={{ padding: '20px', borderRadius: '16px', border: `1px solid ${activeTool.color}44` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontWeight: '700', fontSize: '0.9rem', color: activeTool.color }}>✨ AI Result</span>
            <button onClick={() => navigator.clipboard.writeText(output)} style={{ background: 'var(--bg-glass)', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem' }}>
              Copy
            </button>
          </div>
          <p style={{ lineHeight: '1.7', whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>{output}</p>
        </div>
      )}
    </div>
  );
}
