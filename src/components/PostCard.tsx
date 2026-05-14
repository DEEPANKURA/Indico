'use client';

import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Play, DollarSign, Loader2, Trash2, Music, Volume2, VolumeX, Flag } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toggleLikeAction, toggleFollowAction, deletePostAction, reportPostAction } from '@/app/actions/social';
import { toast } from 'react-hot-toast';
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
    mentions: string[];
    overlays?: {
      filter?: string;
      textItems?: Array<{
        id: string;
        text: string;
        color: string;
        fontSize: number;
        x: number;
        y: number;
      }>;
    };
    timeAgo: string;
    musicUrl?: string;
    musicTitle?: string;
    musicArtist?: string;
    musicStartTime?: number;
    musicVolume?: number;
    videoVolume?: number;
    videoTrimStart?: number;
    videoTrimEnd?: number;
    moderationStatus?: 'pending' | 'approved' | 'flagged' | 'rejected';
  }
}

const parseMetric = (val: string | number) => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return parseInt(val.replace(/,/g, '')) || 0;
  return 0;
};

export default function PostCard({ post }: PostCardProps) {
  const supabase = createClient();
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isVideoMuted, setIsVideoMuted] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null);
    });
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            // Out of view: pause everything
            if (videoRef.current) {
              videoRef.current.pause();
            }
            if (audioRef.current) {
              audioRef.current.pause();
              setIsPlayingMusic(false);
            }
          } else {
            // In view: handle video auto-play if applicable
            if (videoRef.current) {
              videoRef.current.volume = post.videoVolume ?? 1.0;
              if (post.videoTrimStart && videoRef.current.currentTime < post.videoTrimStart) {
                videoRef.current.currentTime = post.videoTrimStart;
              }
              const playPromise = videoRef.current.play();
              if (playPromise !== undefined) {
                playPromise.catch(error => {
                  console.warn('Video auto-play failed or was interrupted:', error);
                });
              }
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    if (videoRef.current) {
      // Handle trim end during playback
      videoRef.current.ontimeupdate = () => {
        if (post.videoTrimEnd && videoRef.current && videoRef.current.currentTime >= post.videoTrimEnd) {
          videoRef.current.currentTime = post.videoTrimStart || 0;
        }
      };
    }
    
    return () => observer.disconnect();
  }, [post.videoVolume, post.videoTrimStart, post.videoTrimEnd]);
  
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

  const handleDelete = async () => {
    if (confirm('Delete this post?')) {
      setIsDeleting(true);
      const res = await deletePostAction(post.id);
      if (res.success) toast.success('Post deleted');
      else toast.error(res.error || 'Failed to delete');
      setIsDeleting(false);
    }
  };

  const handleReport = async () => {
    const reason = prompt('Reason for reporting (e.g. Sexual content, Hate speech, Harassment):');
    if (!reason) return;
    
    setIsReporting(true);
    const res = await reportPostAction(post.id, reason);
    if (res.success) {
      toast.success(res.message || 'Reported successfully');
    } else {
      toast.error(res.error || 'Failed to report');
    }
    setIsReporting(false);
  };

  useEffect(() => {
    const checkLike = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .single();
      
      if (data) setIsLiked(true);
    };
    checkLike();
  }, [post.id]);

  if (isDeleted) return null;

  // Show a placeholder for pending moderation
  if (post.moderationStatus === 'pending') {
    return (
      <div className="glass-card animate-pulse" style={{ padding: '24px', marginBottom: '24px', textAlign: 'center', border: '1px dashed var(--accent-primary)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <Loader2 className="animate-spin text-gradient" size={32} />
          <div style={{ fontWeight: 'bold' }}>AI Moderation in progress...</div>
          <p className="text-sm text-secondary">Your post will be visible to others in a few moments after safety verification.</p>
        </div>
      </div>
    );
  }

  return (
    <article ref={cardRef as any} className="glass-card animate-fade-in" style={{ marginBottom: '24px', overflow: 'hidden' }}>
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
          {currentUserId === post.authorId && (
             <button 
                onClick={handleDelete} 
                disabled={isDeleting}
                style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                title="Delete Post"
             >
               {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
             </button>
          )}
           <button 
              onClick={handleReport} 
              disabled={isReporting}
              style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              title="Report Content"
           >
             {isReporting ? <Loader2 size={18} className="animate-spin" /> : <Flag size={18} />}
           </button>
        </div>
      </div>

      <div style={{ padding: '0 16px 12px 16px' }}>
        <p style={{ marginBottom: '12px', fontSize: '0.95rem', lineHeight: '1.6' }}>{post.content}</p>
        
        {post.musicUrl && (
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px',
            background: 'rgba(var(--accent-primary-rgb), 0.05)', borderRadius: '12px',
            border: '1px solid rgba(var(--accent-primary-rgb), 0.1)',
            marginBottom: '16px', cursor: 'pointer'
          }} onClick={() => {
            if (audioRef.current) {
              if (isPlayingMusic) audioRef.current.pause();
              else audioRef.current.play();
              setIsPlayingMusic(!isPlayingMusic);
            }
          }}>
            <audio ref={audioRef} src={post.musicUrl} loop onPlay={(e) => {
              if (audioRef.current) {
                audioRef.current.volume = post.musicVolume ?? 0.5;
                if (audioRef.current.currentTime < (post.musicStartTime || 0)) {
                  audioRef.current.currentTime = post.musicStartTime || 0;
                }
              }
            }} />
            <div style={{ 
              width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              {isPlayingMusic ? <Volume2 size={16} color="white" /> : <Music size={16} color="white" />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{post.musicTitle}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{post.musicArtist}</div>
            </div>
            {isPlayingMusic && (
              <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '12px' }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="music-bar" style={{ 
                    width: '3px', background: 'var(--accent-neon)', 
                    height: '100%', borderRadius: '10px',
                    animation: `musicBar 0.8s ease-in-out infinite alternate ${i * 0.2}s`
                  }} />
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {post.tags?.map((tag, i) => (
            <span key={i} className="text-gradient" style={{ fontWeight: '600', fontSize: '0.9rem' }}>#{tag}</span>
          ))}
          {post.mentions?.map((mention, i) => (
            <span key={i} style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--accent-primary)' }}>@{mention}</span>
          ))}
        </div>
      </div>

      {post.mediaUrl && (
        <div style={{ position: 'relative', width: '100%', background: '#000', overflow: 'hidden' }}>
          <div style={{ filter: post.overlays?.filter || 'none' }}>
            {post.mediaType === 'video' ? (
              <video 
                ref={videoRef}
                src={post.mediaUrl} 
                autoPlay 
                muted={isVideoMuted} 
                loop 
                playsInline 
                controls
                style={{ width: '100%', height: 'auto', display: 'block' }} 
                onVolumeChange={(e) => {
                  if (videoRef.current) setIsVideoMuted(videoRef.current.muted);
                }}
              />
            ) : (
              <img 
                src={post.mediaUrl} 
                alt="Post content" 
                style={{ 
                  width: '100%', 
                  height: 'auto', 
                  maxHeight: '80vh', 
                  objectFit: 'contain',
                  display: 'block',
                  background: '#000'
                }} 
              />
            )}
          </div>
          
          {/* Text Overlays */}
          {post.overlays?.textItems?.map((item: any) => (
            <div
              key={item.id}
              style={{
                position: 'absolute',
                left: `${item.x}%`,
                top: `${item.y}%`,
                transform: 'translate(-50%, -50%)',
                color: item.color,
                fontSize: `min(calc(1vw + 1vh + ${item.fontSize}px), 40px)`,
                fontWeight: '900',
                textAlign: 'center',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                pointerEvents: 'none',
                whiteSpace: 'pre-wrap',
                maxWidth: '80%',
                zIndex: 5
              }}
            >
              {item.text}
            </div>
          ))}
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
