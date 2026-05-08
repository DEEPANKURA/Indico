'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Shield, Wand2, Hash, FileText, BarChart2, Loader2, Copy, Check, RotateCcw, Save, Trash2, History, LayoutGrid, Zap, Compass } from 'lucide-react';

const tools = [
  { id: 'caption', icon: FileText, label: 'Caption Generator', desc: 'Generate viral captions for your posts', color: '#8b5cf6', prompt: 'Generate 3 viral social media captions for a post about: ', placeholder: 'e.g. A sunset photo at the beach with friends' },
  { id: 'hashtags', icon: Hash, label: 'Hashtag Suggester', desc: 'Get trending hashtags for your content', color: '#06b6d4', prompt: 'Suggest 15 trending hashtags for content about: ', placeholder: 'e.g. Personal finance tips for Gen Z' },
  { id: 'hook', icon: Wand2, label: 'Hook Writer', desc: 'Write scroll-stopping opening lines', color: '#ec4899', prompt: 'Write 3 scroll-stopping hooks for a post about: ', placeholder: 'e.g. Why I quit my 9-5 to become a creator' },
  { id: 'moderation', icon: Shield, label: 'Content Checker', desc: 'Check if your content is safe to post', color: '#10b981', prompt: 'Analyze this content for safety and community guidelines compliance. Highlight any risks: ', placeholder: 'Paste the text you want to check here...' },
  { id: 'analytics', icon: BarChart2, label: 'Growth Advisor', desc: 'Get personalized growth tips', color: '#f97316', prompt: 'Give me 5 specific growth tips for a creator who posts about: ', placeholder: 'e.g. Cooking Italian food for beginners' },
  { id: 'script', icon: Zap, label: 'Script Assistant', desc: 'Write a script for your next reel/video', color: '#facc15', prompt: 'Write a 60-second video script for a reel about: ', placeholder: 'e.g. 3 simple morning routine hacks' },
  { id: 'strategy', icon: Compass, label: 'Content Strategy', desc: 'Get a 7-day content plan', color: '#3b82f6', prompt: 'Create a detailed 7-day content strategy for a creator focused on: ', placeholder: 'e.g. Building a sustainable fashion brand' },
];

export default function AIToolsPage() {
  const [activeTool, setActiveTool] = useState(tools[0]);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'tools' | 'history'>('tools');

  useEffect(() => {
    const savedHistory = localStorage.getItem('indico_ai_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

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
      const resultText = data.result || 'No result generated.';
      setOutput(resultText);
      
      // Save to history
      const newEntry = {
        id: Date.now(),
        tool: activeTool.label,
        input: input.substring(0, 50) + (input.length > 50 ? '...' : ''),
        output: resultText,
        timestamp: new Date().toISOString()
      };
      const updatedHistory = [newEntry, ...history.slice(0, 19)];
      setHistory(updatedHistory);
      localStorage.setItem('indico_ai_history', JSON.stringify(updatedHistory));
    } catch {
      setOutput('Error connecting to AI. Please try again.');
    }
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('indico_ai_history');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '10px', paddingBottom: '100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <Sparkles size={32} style={{ color: 'var(--accent-neon)' }} />
            <h1 style={{ fontSize: '2.2rem', fontWeight: '900', margin: 0 }}>Creator AI</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '1rem' }}>Supercharge your viral potential with Gemini AI</p>
        </div>
        
        <div style={{ display: 'flex', background: 'var(--bg-glass)', borderRadius: '12px', padding: '4px', border: '1px solid var(--border-light)' }}>
          <button 
            onClick={() => setActiveTab('tools')}
            style={{ 
              padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              background: activeTab === 'tools' ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: activeTab === 'tools' ? 'white' : 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700'
            }}
          >
            <LayoutGrid size={18} /> Tools
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            style={{ 
              padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              background: activeTab === 'history' ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: activeTab === 'history' ? 'white' : 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700'
            }}
          >
            <History size={18} /> History
          </button>
        </div>
      </div>

      {activeTab === 'tools' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '32px' }}>
          {/* Tool List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {tools.map((tool) => (
              <button 
                key={tool.id} 
                onClick={() => { setActiveTool(tool); setOutput(''); setInput(''); }}
                style={{
                  padding: '16px', borderRadius: '20px', border: `1px solid ${activeTool.id === tool.id ? tool.color : 'var(--border-light)'}`,
                  background: activeTool.id === tool.id ? `${tool.color}15` : 'var(--bg-glass)',
                  cursor: 'pointer', textAlign: 'left', display: 'flex', gap: '14px', alignItems: 'center',
                  color: 'white', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: activeTool.id === tool.id ? `0 8px 24px -10px ${tool.color}` : 'none',
                  transform: activeTool.id === tool.id ? 'translateX(4px)' : 'none'
                }}
              >
                <div style={{ 
                  width: '40px', height: '40px', borderRadius: '12px', background: `${tool.color}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <tool.icon size={22} style={{ color: tool.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '800', fontSize: '0.95rem' }}>{tool.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{tool.desc}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Workbench */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-card" style={{ padding: '24px', borderRadius: '24px', border: `1px solid ${activeTool.color}30` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: activeTool.color }} />
                <h2 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>{activeTool.label}</h2>
              </div>
              
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={activeTool.placeholder}
                style={{
                  width: '100%', padding: '16px', borderRadius: '16px', minHeight: '140px',
                  background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-light)',
                  color: 'white', outline: 'none', resize: 'none', fontFamily: 'inherit',
                  fontSize: '1rem', boxSizing: 'border-box', marginBottom: '20px',
                  lineHeight: '1.6'
                }}
              />

              <button
                onClick={handleGenerate}
                disabled={loading || !input.trim()}
                className="hover-scale"
                style={{
                  width: '100%', padding: '16px', borderRadius: '16px', border: 'none',
                  background: `linear-gradient(135deg, ${activeTool.color}, ${activeTool.color}cc)`,
                  color: 'white', fontWeight: '800', fontSize: '1rem', cursor: input.trim() ? 'pointer' : 'not-allowed',
                  opacity: input.trim() ? 1 : 0.6,
                  display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px',
                  boxShadow: `0 8px 20px -8px ${activeTool.color}`
                }}
              >
                {loading ? <><Loader2 size={20} className="animate-spin" /> Magically working...</> : <><Sparkles size={20} /> Generate Content</>}
              </button>
            </div>

            {output && (
              <div className="glass-card animate-fade-in" style={{ padding: '24px', borderRadius: '24px', border: `1px solid ${activeTool.color}50`, background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontWeight: '800', fontSize: '0.9rem', color: activeTool.color, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Check size={16} /> Generated Result
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleCopy} style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-light)', color: 'white', cursor: 'pointer', padding: '6px 14px', borderRadius: '10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button onClick={() => setOutput('')} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px 10px', borderRadius: '10px' }}>
                      <RotateCcw size={16} />
                    </button>
                  </div>
                </div>
                <div style={{ 
                  lineHeight: '1.8', whiteSpace: 'pre-wrap', fontSize: '1rem', 
                  color: 'rgba(255,255,255,0.9)', padding: '16px', background: 'rgba(0,0,0,0.3)',
                  borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)'
                }}>
                  {output}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '32px', borderRadius: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>Recent Generations</h2>
            {history.length > 0 && (
              <button onClick={clearHistory} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Trash2 size={16} /> Clear All
              </button>
            )}
          </div>
          
          {history.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {history.map((entry) => (
                <div key={entry.id} style={{ padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '800', color: 'var(--accent-secondary)', fontSize: '0.9rem' }}>{entry.tool}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(entry.timestamp).toLocaleDateString()}</span>
                  </div>
                  <div style={{ color: 'white', fontSize: '0.9rem', marginBottom: '10px', opacity: 0.8 }}>"{entry.input}"</div>
                  <button 
                    onClick={() => { setOutput(entry.output); setActiveTab('tools'); setActiveTool(tools.find(t => t.label === entry.tool) || tools[0]); }}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem', padding: 0 }}
                  >
                    Restore Generation
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              <History size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
              <p>No history yet. Start generating content to see it here!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
