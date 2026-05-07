import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Play } from 'lucide-react';
import Image from 'next/image';

interface PostCardProps {
  post: {
    id: string;
    author: {
      name: string;
      handle: string;
      avatar: string;
      isNew: boolean;
    };
    content: string;
    mediaUrl: string;
    mediaType: 'video' | 'image';
    likes: string;
    comments: string;
    shares: string;
    tags: string[];
    timeAgo: string;
  }
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <article className="glass-card animate-fade-in" style={{ marginBottom: '24px', overflow: 'hidden' }}>
      <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '48px', height: '48px', 
            borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 'bold', fontSize: '1.2rem', color: 'white',
            border: '2px solid var(--bg-primary)', position: 'relative'
          }}>
            {post.author.name[0]}
            {post.author.isNew && (
              <div style={{
                position: 'absolute', bottom: '-4px', right: '-4px',
                width: '14px', height: '14px', borderRadius: '50%',
                background: 'var(--accent-neon)', border: '2px solid var(--bg-secondary)'
              }}></div>
            )}
          </div>
          <div>
            <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {post.author.name}
              {post.author.isNew && <span className="badge badge-neon">NEW</span>}
            </div>
            <div className="text-sm text-secondary">
              {post.timeAgo} • {post.author.handle}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary" style={{ padding: '6px 16px', fontSize: '0.85rem' }}>Follow</button>
          <button style={{ color: 'var(--text-secondary)' }}><MoreHorizontal size={20} /></button>
        </div>
      </div>

      <div style={{ padding: '0 16px 12px 16px' }}>
        <p style={{ marginBottom: '12px', fontSize: '0.95rem', lineHeight: '1.6' }}>{post.content}</p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {post.tags.map((tag, i) => (
            <span key={i} className="text-gradient" style={{ fontWeight: '600', fontSize: '0.9rem' }}>#{tag}</span>
          ))}
        </div>
      </div>

      {post.mediaUrl && (
        <div style={{ position: 'relative', width: '100%', aspectRatio: '4/5', background: '#000', overflow: 'hidden' }}>
          {/* Placeholder for video/image using a colored background pattern until next/image setup */}
          <div style={{ 
            position: 'absolute', inset: 0, 
            background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.8) 100%), url("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop")',
            backgroundSize: 'cover', backgroundPosition: 'center'
          }} />
          
          {post.mediaType === 'video' && (
            <div style={{ 
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s', border: '1px solid rgba(255,255,255,0.4)'
            }} className="play-btn">
              <Play size={32} color="white" style={{ marginLeft: '4px' }} />
            </div>
          )}
        </div>
      )}

      <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', gap: '24px' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', transition: 'color 0.2s' }}>
            <Heart size={22} /> <span className="text-sm font-semibold">{post.likes}</span>
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', transition: 'color 0.2s' }}>
            <MessageCircle size={22} /> <span className="text-sm font-semibold">{post.comments}</span>
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', transition: 'color 0.2s' }}>
            <Share2 size={22} /> <span className="text-sm font-semibold">{post.shares}</span>
          </button>
        </div>
        <button style={{ color: 'var(--text-secondary)' }}>
          <Bookmark size={22} />
        </button>
      </div>
    </article>
  );
}
