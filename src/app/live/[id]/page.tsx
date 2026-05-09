'use client';

import { useState, useEffect, use, useRef, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Eye, Heart, MessageSquare, Send, X, Loader2, DollarSign, Gift, Zap, Radio } from 'lucide-react';
import Image from 'next/image';

export default function WatchLivePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [stream, setStream] = useState<any | null>(null);
  const [messages, setMessages] = useState<{id: number, user: string, text: string, system?: boolean}[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [likes, setLikes] = useState(0);
  const [viewers, setViewers] = useState(0);
  const [user, setUser] = useState<any | null>(null);
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
  }, [id, supabase, fetchStreamData, router]);

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

  const [activeHearts, setActiveHearts] = useState<{id: number, x: number}[]>([]);

  const handleLike = () => {
    setLikes(prev => prev + 1);
    const newHeart = { id: Date.now(), x: Math.random() * 40 - 20 };
    setActiveHearts(prev => [...prev, newHeart]);
    // Remove heart after animation
    setTimeout(() => {
      setActiveHearts(prev => prev.filter(h => h.id !== newHeart.id));
    }, 2000);
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
      color: 'white', overflow: 'hidden', fontFamily: 'inherit'
    }}>
      {/* 1. Full Screen Video Background */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <video 
          src="https://player.vimeo.com/external/494449711.sd.mp4?s=0cf2e434850d53c6145326771d9d784a861f6eb2&profile_id=165&oauth2_token_id=57447761"
          autoPlay 
          loop 
          muted 
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {/* Dark overlay for readability */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 20%, transparent 60%, rgba(0,0,0,0.6) 100%)' }} />
      </div>

      {/* 2. Header: Streamer Info & Close Button */}
      <div style={{ 
        position: 'absolute', top: 0, left: 0, right: 0, 
        padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        zIndex: 10, background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--accent-primary)', padding: '2px', overflow: 'hidden' }}>
            <img src={stream.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${stream.profiles?.username}`} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" />
          </div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {stream.profiles?.username}
              <span style={{ background: '#ef4444', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', fontWeight: '900' }}>LIVE</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Eye size={12} /> {viewers} viewers
            </div>
          </div>
        </div>
        <button onClick={() => router.push('/live')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}>
          <X size={28} />
        </button>
      </div>

      {/* 3. Overlaid Chat (Bottom Left) */}
      <div style={{ 
        position: 'absolute', bottom: '100px', left: 0, width: '100%', maxWidth: '340px',
        maxHeight: '260px', padding: '0 20px', overflowY: 'hidden',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        zIndex: 5, maskImage: 'linear-gradient(to top, black 80%, transparent 100%)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} className="no-scrollbar">
          {messages.slice(-6).map((msg) => (
            <div key={msg.id} style={{ 
              display: 'flex', gap: '8px', alignItems: 'flex-start',
              animation: 'slideInUp 0.3s ease-out'
            }}>
              <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                {msg.user}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#eee', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* 4. Footer: Chat Input & Action Buttons */}
      <div style={{ 
        position: 'absolute', bottom: 0, left: 0, right: 0, 
        padding: '20px', display: 'flex', alignItems: 'center', gap: '12px',
        zIndex: 10, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)'
      }}>
        <form onSubmit={handleSendMessage} style={{ flex: 1, position: 'relative' }}>
          <input 
            type="text"
            placeholder="Comment..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            style={{ 
              width: '100%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '24px', padding: '12px 20px', color: 'white', outline: 'none',
              backdropFilter: 'blur(10px)', fontSize: '0.9rem'
            }}
          />
          <button type="submit" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'white', opacity: newMessage.trim() ? 1 : 0.5 }}>
            <Send size={20} />
          </button>
        </form>
        
        <button onClick={handleLike} className="btn-icon-live" style={{ 
          width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', color: 'white',
          backdropFilter: 'blur(10px)', cursor: 'pointer'
        }}>
          <Heart size={24} fill={likes > 0 ? '#ef4444' : 'none'} color={likes > 0 ? '#ef4444' : 'white'} />
        </button>

        {/* Floating Hearts Animation System */}
        <div style={{ position: 'absolute', bottom: '80px', right: '20px', pointerEvents: 'none' }}>
           {activeHearts.map((heart) => (
             <div key={heart.id} className="floating-heart" style={{
               position: 'absolute', bottom: 0, right: 0, color: '#ef4444',
               transform: `translateX(${heart.x}px)`,
               animation: `floatUp 1.5s ease-out forwards`
             }}>
               <Heart size={24} fill="#ef4444" />
             </div>
           ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInUp {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes floatUp {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-200px) translateX(${Math.random() * 40 - 20}px) scale(0.5); opacity: 0; }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
