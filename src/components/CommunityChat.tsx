'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Send, Smile, Loader2, User } from 'lucide-react';

const STICKERS = [
  'https://fonts.gstatic.com/s/e/notoemoji/latest/1f600/512.gif',
  'https://fonts.gstatic.com/s/e/notoemoji/latest/1f60d/512.gif',
  'https://fonts.gstatic.com/s/e/notoemoji/latest/1f929/512.gif',
  'https://fonts.gstatic.com/s/e/notoemoji/latest/1f973/512.gif',
  'https://fonts.gstatic.com/s/e/notoemoji/latest/1f60e/512.gif',
];

export default function CommunityChat({ communityId }: { communityId: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showStickers, setShowStickers] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      fetchMessages();
    };
    init();

    const channel = supabase
      .channel(`community_chat_${communityId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `community_id=eq.${communityId}`
      }, async (payload) => {
        const newMsg = payload.new;
        // Fetch sender profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, avatar_url, full_name')
          .eq('id', newMsg.sender_id)
          .single();
        
        setMessages(prev => [...prev, { ...newMsg, sender: profile }]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [communityId]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*, sender:profiles!sender_id(username, avatar_url, full_name)')
      .eq('community_id', communityId)
      .order('created_at', { ascending: true });

    setMessages(data || []);
    setLoading(false);
  };

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const handleSend = async (stickerUrl?: string) => {
    if ((!input.trim() && !stickerUrl) || !user) return;

    const newMsg = {
      community_id: communityId,
      sender_id: user.id,
      content: stickerUrl ? '' : input,
      message_type: stickerUrl ? 'sticker' : 'text',
      sticker_url: stickerUrl || null
    };

    if (!stickerUrl) setInput('');
    setShowStickers(false);

    const { error } = await supabase.from('messages').insert(newMsg);
    if (error) alert('Failed to send: ' + error.message);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="animate-spin" /></div>;

  return (
    <div className="glass-card" style={{ height: '500px', display: 'flex', flexDirection: 'column', borderRadius: '24px', overflow: 'hidden' }}>
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '100px' }}>
            No messages yet. Start the conversation!
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: msg.sender_id === user?.id ? 'flex-end' : 'flex-start' 
          }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {msg.sender?.full_name || msg.sender?.username || 'User'}
            </div>
            <div style={{
              maxWidth: '80%', 
              padding: msg.message_type === 'sticker' ? '0' : '10px 14px',
              borderRadius: msg.sender_id === user?.id ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: msg.message_type === 'sticker' ? 'transparent' : (msg.sender_id === user?.id ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)'),
              color: 'white',
              fontSize: '0.9rem'
            }}>
              {msg.message_type === 'sticker' ? (
                <img src={msg.sticker_url} style={{ width: '100px', height: '100px' }} />
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '16px', borderTop: '1px solid var(--border-light)', display: 'flex', gap: '8px', position: 'relative' }}>
        <button onClick={() => setShowStickers(!showStickers)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <Smile size={20} />
        </button>

        {showStickers && (
          <div className="glass-card" style={{ 
            position: 'absolute', bottom: '100%', left: '16px', width: '200px', 
            padding: '10px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px',
            borderRadius: '16px', marginBottom: '10px', zIndex: 10
          }}>
            {STICKERS.map((s, i) => (
              <img key={i} src={s} style={{ width: '100%', cursor: 'pointer' }} onClick={() => handleSend(s)} />
            ))}
          </div>
        )}

        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Message community..." 
          style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)', borderRadius: '20px', padding: '8px 16px', color: 'white', outline: 'none' }}
        />
        <button onClick={() => handleSend()} style={{ background: 'var(--accent-primary)', border: 'none', color: 'white', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
