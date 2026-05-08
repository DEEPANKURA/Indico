'use client';

import { useState, useEffect, use, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Users, Eye, Heart, MessageSquare, Send, X, ArrowLeft, Loader2, Share2, DollarSign, Gift, Zap } from 'lucide-react';

export default function WatchLivePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [stream, setStream] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [likes, setLikes] = useState(0);
  const [viewers, setViewers] = useState(0);
  const [user, setUser] = useState<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const supabase = createClient();
  const router = useRouter();

  const fetchStreamData = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    setUser(currentUser);

    const { data, error } = await supabase
      .from('live_streams')
      .select(`
        *,
        profiles:streamer_id(username, full_name, avatar_url, bio)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      router.push('/live');
      return;
    }

    setStream(data);
    setViewers(data.viewer_count || 0);
    setLoading(false);
    
    // Simulate initial messages
    setMessages([
      { id: 1, user: 'IndicoBot', text: 'Welcome to the live chat! Be respectful and have fun. ✨', system: true },
      { id: 2, user: 'CryptoKing', text: 'LETS GOOOOOO! 🚀' },
      { id: 3, user: 'SarahJ', text: 'Loving the vibe today!' },
    ]);
  };

  useEffect(() => {
    fetchStreamData();

    // Real-time viewer count and status
    const channel = supabase
      .channel(`stream_${id}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'live_streams', 
        filter: `id=eq.${id}` 
      }, (payload) => {
        if (!payload.new.is_active) {
          alert('Stream has ended');
          router.push('/live');
        }
        setViewers(payload.new.viewer_count);
      })
      .subscribe();

    // Increment viewer count on join
    supabase.rpc('increment_viewer_count', { stream_id: id });

    return () => {
      supabase.removeChannel(channel);
      supabase.rpc('decrement_viewer_count', { stream_id: id });
    };
  }, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    const msg = {
      id: Date.now(),
      user: user?.user_metadata?.username || 'You',
      text: newMessage,
    };
    
    setMessages([...messages, msg]);
    setNewMessage('');
  };

  const handleLike = () => {
    setLikes(prev => prev + 1);
    // Realtime animation trigger could go here
  };

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#000', color: 'white' }}>
      <Loader2 className="animate-spin" size={40} style={{ color: 'var(--accent-primary)', marginBottom: '16px' }} />
      <span>Connecting to stream...</span>
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', height: '100vh', background: '#000', overflow: 'hidden' }}>
      {/* Main Video Area */}
      <div style={{ position: 'relative', height: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <button 
          onClick={() => router.push('/live')}
          style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10, background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', padding: '10px', borderRadius: '50%', cursor: 'pointer' }}
        >
          <ArrowLeft size={24} />
        </button>

        {/* Video Area */}
        <div style={{ width: '100%', height: '100%', position: 'relative', background: '#000' }}>
           {/* Simulated Live Stream Feed */}
           <video 
              src="https://assets.mixkit.co/videos/preview/mixkit-gaming-stream-on-a-laptop-screen-34444-large.mp4"
              autoPlay 
              loop 
              muted 
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
           />
           
           <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, transparent 20%, rgba(0,0,0,0.4) 100%)', pointerEvents: 'none' }} />
           
           {/* Connection Overlay (Fade out) */}
           <div style={{ 
             position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
             background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
             animation: 'fadeOut 2s forwards 3s', pointerEvents: 'none'
           }}>
             <Radio size={80} style={{ color: 'var(--accent-primary)', marginBottom: '20px' }} />
             <p style={{ color: 'white', fontSize: '1.2rem', fontWeight: '600' }}>Establishing Secure Connection...</p>
             <div className="badge badge-neon" style={{ marginTop: '12px' }}>P2P ENCRYPTED</div>
           </div>
        </div>

        {/* Overlay Info */}
        <div style={{ position: 'absolute', top: '24px', right: '24px', display: 'flex', gap: '12px' }}>
          <div style={{ background: '#ef4444', color: 'white', padding: '6px 14px', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white', animation: 'pulse 1.5s infinite' }} />
            LIVE
          </div>
          <div style={{ background: 'rgba(0,0,0,0.6)', color: 'white', padding: '6px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', backdropFilter: 'blur(10px)' }}>
            <Eye size={18} /> {viewers}
          </div>
        </div>

        {/* Streamer Info Bar (Bottom) */}
        <div style={{ position: 'absolute', bottom: '0', left: '0', width: '100%', padding: '40px 32px 32px', background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ 
              width: '64px', height: '64px', borderRadius: '50%', 
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              padding: '2px'
            }}>
              <img 
                src={stream.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${stream.profiles?.username}`} 
                style={{ width: '100%', height: '100%', borderRadius: '50%', border: '2px solid black' }} 
              />
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ color: 'white', margin: 0, fontSize: '1.5rem', fontWeight: '800' }}>{stream.title}</h1>
              <div style={{ color: 'var(--accent-secondary)', fontSize: '1rem', fontWeight: '600', marginTop: '4px' }}>
                @{stream.profiles?.username} · {stream.category}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button onClick={handleLike} className="hover-scale" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '12px 24px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                <Heart size={20} fill={likes > 0 ? '#ef4444' : 'none'} color={likes > 0 ? '#ef4444' : 'white'} /> {likes}
              </button>
              <button className="hover-scale" style={{ background: 'var(--accent-primary)', border: 'none', color: 'white', padding: '12px 24px', borderRadius: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                Follow
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Chat */}
      <div style={{ background: '#111', borderLeft: '1px solid #222', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: 'white', fontSize: '1.1rem', margin: 0, fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MessageSquare size={18} /> Live Chat
          </h2>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Real-time</div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }} className="no-scrollbar">
          {messages.map((msg) => (
            <div key={msg.id} style={{ 
              background: msg.system ? 'rgba(139,92,246,0.1)' : 'transparent',
              padding: msg.system ? '10px' : '0',
              borderRadius: '8px'
            }}>
              <span style={{ fontWeight: '800', color: msg.system ? 'var(--accent-secondary)' : '#a5b4fc', fontSize: '0.9rem', marginRight: '8px' }}>
                {msg.user}:
              </span>
              <span style={{ color: 'white', fontSize: '0.9rem', lineHeight: '1.5' }}>{msg.text}</span>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Quick Interaction */}
        <div style={{ padding: '0 20px 10px', display: 'flex', gap: '10px' }}>
          {[Zap, Gift, DollarSign].map((Icon, i) => (
            <button key={i} style={{ flex: 1, padding: '8px', borderRadius: '8px', background: '#222', border: '1px solid #333', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <Icon size={16} style={{ margin: '0 auto' }} />
            </button>
          ))}
        </div>

        {/* Chat Input */}
        <form onSubmit={handleSendMessage} style={{ padding: '20px', borderTop: '1px solid #222' }}>
          <div style={{ position: 'relative' }}>
            <input 
              type="text"
              placeholder="Send a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              style={{ 
                width: '100%', background: '#222', border: '1px solid #333', borderRadius: '12px', 
                padding: '12px 48px 12px 16px', color: 'white', outline: 'none', boxSizing: 'border-box'
              }}
            />
            <button 
              type="submit"
              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer' }}
            >
              <Send size={20} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Add Radio from lucide-react if not imported
import { Radio } from 'lucide-react';
