'use client';

import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Play, DollarSign, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { tipCreatorAction } from '@/app/actions/tip';
import { toggleLikeAction, toggleFollowAction } from '@/app/actions/social';
import Link from 'next/link';
import Image from 'next/image';
import CommentModal from './CommentModal';
import ShareModal from './ShareModal';

interface PostCardProps {
  post: {
    id: string;
    authorId?: string;
    author: {
      name: string;
      handle: string;
      avatar: string;
      isNew: boolean;
    };
    content: string;
    mediaUrl?: string;
    mediaType?: 'video' | 'image';
    likes: string | number;
    comments: string | number;
    shares: string | number;
    tags: string[];
    timeAgo: string;
  }
}

const parseMetric = (val: string | number) => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return parseInt(val.replace(/,/g, '')) || 0;
  return 0;
};

export default function PostCard({ post }: PostCardProps) {
  const [isTipping, setIsTipping] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  
  const handleTip = async () => {
    if (!post.authorId) return;
    setIsTipping(true);
    try {
      const result = await tipCreatorAction(post.id, post.authorId, 5.00); // fixed tip amount for now
      if (result.success) {
        alert(`Successfully sent $5 to ${post.author.name}!`);
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to send tip');
    } finally {
      setIsTipping(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Check out this post on Indico',
      text: post.content,
      url: `${window.location.origin}/post/${post.id}`
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        alert('Link copied to clipboard!');
      }
    } catch (err) {}
  };

  const [localLikes, setLocalLikes] = useState(parseMetric(post.likes));
  const [isLiked, setIsLiked] = useState(false); // We don't have initial state from parent yet
  const handleLike = async () => {
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLocalLikes(prev => wasLiked ? Math.max(0, prev - 1) : prev + 1);
    
    const res = await toggleLikeAction(post.id);
    if (!res.success) {
      setIsLiked(wasLiked);
      setLocalLikes(prev => wasLiked ? prev + 1 : Math.max(0, prev - 1));
    } else {
      setIsLiked(res.liked!);
    }
  };

  const [isFollowing, setIsFollowing] = useState(false);
  const handleFollow = async () => {
    if (!post.authorId) return;
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    
    const res = await toggleFollowAction(post.authorId);
    if (!res.success) {
      setIsFollowing(wasFollowing);
    } else {
      setIsFollowing(res.following!);
    }
  };

  return (
    <article className="glass-card animate-fade-in" style={{ marginBottom: '24px', overflow: 'hidden' }}>
      <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href={`/profile/${post.authorId}`} style={{ textDecoration: 'none' }}>
            <div style={{ 
              width: '48px', height: '48px', 
              borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 'bold', fontSize: '1.2rem', color: 'white',
              border: '2px solid var(--bg-primary)', position: 'relative', overflow: 'hidden'
            }}>
              {post.author.avatar ? (
                <img src={post.author.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                post.author.name?.[0]?.toUpperCase() || 'A'
              )}
              {post.author.isNew && (
                <div style={{
                  position: 'absolute', bottom: '-4px', right: '-4px',
                  width: '14px', height: '14px', borderRadius: '50%',
                  background: 'var(--accent-neon)', border: '2px solid var(--bg-secondary)'
                }}></div>
              )}
            </div>
          </Link>
          <div>
            <Link href={`/profile/${post.authorId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {post.author.name}
                {post.author.isNew && <span className="badge badge-neon">NEW</span>}
              </div>
            </Link>
            <div className="text-sm text-secondary">
              {post.timeAgo} • {post.author.handle}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {post.authorId && (
            <button onClick={handleFollow} className={isFollowing ? "btn-secondary" : "btn-primary"} style={{ padding: '6px 16px', fontSize: '0.85rem' }}>
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
          <button style={{ color: 'var(--text-secondary)' }}><MoreHorizontal size={20} /></button>
        </div>
      </div>

      <div style={{ padding: '0 16px 12px 16px' }}>
        <p style={{ marginBottom: '12px', fontSize: '0.95rem', lineHeight: '1.6' }}>{post.content}</p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {post.tags?.map((tag, i) => (
            <span key={i} className="text-gradient" style={{ fontWeight: '600', fontSize: '0.9rem' }}>#{tag}</span>
          ))}
        </div>
      </div>

      {post.mediaUrl && (
        <div style={{ position: 'relative', width: '100%', background: '#000', overflow: 'hidden' }}>
          {post.mediaType === 'video' ? (
            <video 
              src={post.mediaUrl} 
              autoPlay 
              muted 
              loop 
              playsInline 
              controls
              style={{ width: '100%', display: 'block' }} 
            />
          ) : (
            <div style={{ 
              width: '100%', aspectRatio: '4/5',
              background: `url("${post.mediaUrl}")`,
              backgroundSize: 'cover', backgroundPosition: 'center'
            }} />
          )}
        </div>
      )}

      <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', gap: '24px' }}>
          <button onClick={handleLike} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isLiked ? '#ef4444' : 'var(--text-secondary)', transition: 'color 0.2s' }}>
            <Heart size={22} fill={isLiked ? '#ef4444' : 'none'} /> <span className="text-sm font-semibold">{localLikes}</span>
          </button>
          <button onClick={() => setShowComments(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', transition: 'color 0.2s' }}>
            <MessageCircle size={22} /> <span className="text-sm font-semibold">{post.comments}</span>
          </button>
          <button onClick={() => setShowShare(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', transition: 'color 0.2s' }}>
            <Share2 size={22} /> <span className="text-sm font-semibold">{post.shares}</span>
          </button>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {post.authorId && (
            <button 
              onClick={handleTip} 
              disabled={isTipping}
              className="btn-primary" 
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.85rem' }}
            >
              {isTipping ? <Loader2 size={16} className="animate-spin" /> : <DollarSign size={16} />}
              Tip $5
            </button>
          )}
          <button style={{ color: 'var(--text-secondary)' }}>
            <Bookmark size={22} />
          </button>
        </div>
      </div>

      {showComments && (
        <CommentModal postId={post.id} onClose={() => setShowComments(false)} />
      )}

      {showShare && (
        <ShareModal postId={post.id} onClose={() => setShowShare(false)} />
      )}
    </article>
  );
}
