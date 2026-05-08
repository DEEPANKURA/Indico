'use client';

import { useState, useEffect, use, useRef, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Users, Eye, Heart, MessageSquare, Send, X, ArrowLeft, Loader2, Share2, DollarSign, Gift, Zap, Radio } from 'lucide-react';

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

  const fetchStreamData = useCallback(async () => {
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
  }, [id, supabase, router]);

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
  }, [id, supabase, fetchStreamData]);

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
  };

  if (loading || !stream) return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000', color: 'white' }}>
      <Loader2 className="animate-spin" size={40} style={{ color: 'var(--accent-primary)', marginBottom: '16px' }} />
      <span>Connecting to secure stream...</span>
    </div>
  );

  return (
    <div style={{ 
      position: 'fixed', inset: 0, zIndex: 2500, background: '#000', 
      display: 'flex', flexDirection: 'column', overflow: 'hidden' 
    }}>
      {/* Top Bar for Mobile/Exit */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '60px', zIndex: 10, display: 'flex', alignItems: 'center', padding: '0 20px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)', pointerEvents: 'none' }}>
        <button 
          onClick={() => router.push('/live')}
          style={{ pointerEvents: 'auto', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '10px', borderRadius: '50%', cursor: 'pointer', backdropFilter: 'blur(10px)' }}
        >
          <X size={24} />
        </button>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 380px', 
        height: '100%',
        flex: 1
      }} className="live-layout-grid">
        {/* Main Video Area */}
        <div style={{ position: 'relative', height: '100%', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

        {/* Video Area */}
        <div style={{ width: '100%', height: '100%', position: 'relative', background: '#000' }}>
           {/* Robust Live Stream Feed */}
           <video 
              src="https://player.vimeo.com/external/494449711.sd.mp4?s=0cf2e434850d53c6145326771d9d784a861f6eb2&profile_id=165&oauth2_token_id=57447761"
              autoPlay 
              loop 
              muted 
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
           />
           
           <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, transparent 40%, rgba(0,0,0,0.6) 100%)', pointerEvents: 'none' }} />
           
           {/* Connection Overlay */}
           <div style={{ 
             position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
             background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
             animation: 'fadeOut 1.5s forwards 4s', pointerEvents: 'none'
           }}>
             <div style={{ position: 'relative' }}>
                <Radio size={80} style={{ color: 'var(--accent-primary)', marginBottom: '20px' }} />
                <div className="animate-ping" style={{ position: 'absolute', top: 0, left: 0, width: '80px', height: '80px', background: 'var(--accent-primary)', borderRadius: '50%', opacity: 0.2 }} />
             </div>
             <p style={{ color: 'white', fontSize: '1.4rem', fontWeight: '800', letterSpacing: '1px' }}>SYNCING SIGNAL...</p>
             <div style={{ marginTop: '16px', padding: '6px 16px', borderRadius: '20px', border: '1px solid var(--accent-secondary)', color: 'var(--accent-secondary)', fontSize: '0.8rem', fontWeight: 'bold' }}>
                HIGH-BANDWIDTH P2P MESH ACTIVE
             </div>
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
        <div style={{ position: 'absolute', bottom: '0', left: '0', width: '100%', padding: '60px 32px 32px', background: 'linear-gradient(to top, rgba(0,0,0,0.95), transparent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', maxWidth: '900px' }}>
            <div style={{ 
              width: '60px', height: '60px', borderRadius: '50%', 
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              padding: '2px', flexShrink: 0
            }}>
              <img 
                src={stream.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${stream.profiles?.username}`} 
                style={{ width: '100%', height: '100%', borderRadius: '50%', border: '2px solid black', objectFit: 'cover' }} 
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ color: 'white', margin: 0, fontSize: '1.4rem', fontWeight: '800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stream.title}</h1>
              <div style={{ color: 'var(--accent-secondary)', fontSize: '0.95rem', fontWeight: '600', marginTop: '4px' }}>
                @{stream.profiles?.username} · {stream.category}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
              <button onClick={handleLike} className="hover-scale" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '10px 18px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                <Heart size={18} fill={likes > 0 ? '#ef4444' : 'none'} color={likes > 0 ? '#ef4444' : 'white'} /> {likes}
              </button>
              <button className="hover-scale" style={{ background: 'var(--accent-primary)', border: 'none', color: 'white', padding: '10px 20px', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer' }}>
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
