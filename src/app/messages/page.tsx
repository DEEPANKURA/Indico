'use client';

import { MessageSquare, Send, Search } from 'lucide-react';
import { useState } from 'react';

const conversations = [
  { id: 1, name: 'Luna Creative', handle: '@luna_create', lastMsg: 'Loved your last post! 🔥', time: '2m', unread: 2, avatar: 'L' },
  { id: 2, name: 'TechBro Dev', handle: '@techbro_dev', lastMsg: 'Can we collab on this?', time: '15m', unread: 0, avatar: 'T' },
  { id: 3, name: 'BeatMaker Pro', handle: '@beatmakerpro', lastMsg: 'Check out my new track!', time: '1h', unread: 0, avatar: 'B' },
  { id: 4, name: 'Pixel Artist', handle: '@pixelart', lastMsg: 'Thanks for the follow!', time: '3h', unread: 1, avatar: 'P' },
];

const mockMessages = [
  { from: 'them', text: 'Hey! Loved your last post!', time: '10:30' },
  { from: 'me', text: 'Thank you so much! 😊', time: '10:32' },
  { from: 'them', text: 'Would love to collab sometime!', time: '10:33' },
  { from: 'me', text: 'That would be amazing! What did you have in mind?', time: '10:35' },
  { from: 'them', text: 'Loved your last post! 🔥', time: '10:40' },
];

export default function MessagesPage() {
  const [selected, setSelected] = useState(conversations[0]);
  const [input, setInput] = useState('');

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingTop: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <MessageSquare size={28} style={{ color: 'var(--accent-secondary)' }} />
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Messages</h1>
      </div>

      <div className="glass-card" style={{ borderRadius: '16px', overflow: 'hidden', display: 'flex', height: '600px' }}>
        {/* Sidebar */}
        <div style={{ width: '240px', borderRight: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-glass)', borderRadius: '10px', padding: '8px 12px' }}>
              <Search size={16} style={{ color: 'var(--text-secondary)' }} />
              <input type="text" placeholder="Search..." style={{ background: 'none', border: 'none', outline: 'none', color: 'white', width: '100%', fontSize: '0.9rem' }} />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {conversations.map((conv) => (
              <div key={conv.id} onClick={() => setSelected(conv)} style={{
                padding: '12px 16px', cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'center',
                background: selected.id === conv.id ? 'var(--bg-glass-hover)' : 'transparent',
                borderLeft: selected.id === conv.id ? '3px solid var(--accent-secondary)' : '3px solid transparent',
                transition: 'all 0.15s'
              }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                }}>{conv.avatar}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{conv.name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{conv.time}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.lastMsg}</div>
                </div>
                {conv.unread > 0 && (
                  <span style={{ background: 'var(--accent-primary)', color: 'white', fontSize: '11px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '10px' }}>{conv.unread}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{selected.avatar}</div>
            <div>
              <div style={{ fontWeight: '700' }}>{selected.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{selected.handle}</div>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {mockMessages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.from === 'me' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '75%', padding: '10px 14px', borderRadius: msg.from === 'me' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: msg.from === 'me' ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' : 'var(--bg-glass)',
                  fontSize: '0.9rem', lineHeight: '1.4'
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-light)', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              style={{ flex: 1, background: 'var(--bg-glass)', border: '1px solid var(--border-light)', borderRadius: '24px', padding: '10px 16px', color: 'white', outline: 'none' }}
            />
            <button className="btn-primary" style={{ padding: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
