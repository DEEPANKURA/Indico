'use client';

import { Radio, Users, Eye, Heart } from 'lucide-react';

const liveStreams = [
  { streamer: 'BeatMaker Pro', handle: '@beatmakerpro', title: '🎵 Live Beat Session - Making a Trap Beat from Scratch', viewers: '12.4K', category: 'Music', duration: '1:24:30', avatar: 'B', color: '#8b5cf6' },
  { streamer: 'Luna Creative', handle: '@luna_create', title: '🎨 Digital Art Process - Cyberpunk Portrait Commission', viewers: '8.9K', category: 'Art', duration: '0:45:12', avatar: 'L', color: '#ec4899' },
  { streamer: 'TechBro Dev', handle: '@techbro_dev', title: '💻 Building a SaaS in 24 hours - Day 2', viewers: '6.1K', category: 'Tech', duration: '2:10:05', avatar: 'T', color: '#06b6d4' },
  { streamer: 'GamingKing', handle: '@gamingking', title: '🎮 Ranked Grind to Diamond - !commands for drops', viewers: '24.2K', category: 'Gaming', duration: '3:05:44', avatar: 'G', color: '#10b981' },
  { streamer: 'FitnessCoach', handle: '@fitnesscoach', title: '💪 Full Body HIIT Workout - Join me live!', viewers: '3.2K', category: 'Fitness', duration: '0:28:16', avatar: 'F', color: '#ef4444' },
];

export default function LivePage() {
  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingTop: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <Radio size={28} style={{ color: '#ef4444' }} />
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Live</h1>
        <span style={{ background: '#ef4444', color: 'white', fontSize: '0.75rem', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', animation: 'pulse 2s infinite' }}>
          {liveStreams.length} LIVE
        </span>
      </div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Catch your favourite creators live, right now</p>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
        {['All', 'Music', 'Gaming', 'Art', 'Tech', 'Fitness', 'Talk'].map((cat) => (
          <button key={cat} style={{
            padding: '6px 16px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600', whiteSpace: 'nowrap',
            background: cat === 'All' ? '#ef4444' : 'var(--bg-glass)',
            border: '1px solid var(--border-light)', color: 'white', cursor: 'pointer'
          }}>{cat}</button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {liveStreams.map((stream, i) => (
          <div key={i} className="glass-card animate-fade-in" style={{ borderRadius: '16px', overflow: 'hidden', cursor: 'pointer' }}>
            {/* Thumbnail */}
            <div style={{
              height: '200px', position: 'relative',
              background: `linear-gradient(135deg, ${stream.color}44, #000)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <div style={{ fontSize: '4rem' }}>
                {stream.category === 'Music' ? '🎵' : stream.category === 'Art' ? '🎨' : stream.category === 'Tech' ? '💻' : stream.category === 'Gaming' ? '🎮' : '💪'}
              </div>
              {/* Live badge */}
              <div style={{ position: 'absolute', top: '12px', left: '12px', background: '#ef4444', color: 'white', fontSize: '0.75rem', fontWeight: '700', padding: '3px 10px', borderRadius: '4px' }}>
                ● LIVE
              </div>
              {/* Viewer count */}
              <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '0.8rem', fontWeight: '600', padding: '4px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Eye size={14} /> {stream.viewers}
              </div>
              {/* Duration */}
              <div style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '0.8rem', padding: '3px 8px', borderRadius: '4px' }}>
                {stream.duration}
              </div>
            </div>

            <div style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0, border: '2px solid #ef4444',
                background: `linear-gradient(135deg, ${stream.color}, var(--accent-secondary))`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
              }}>{stream.avatar}</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: '700', marginBottom: '2px', lineHeight: '1.3' }}>{stream.title}</p>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  {stream.streamer} · <span style={{ color: stream.color }}>{stream.category}</span>
                </div>
              </div>
              <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem', flexShrink: 0, background: '#ef4444', borderColor: '#ef4444' }}>
                Watch
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
