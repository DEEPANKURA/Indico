'use client';

import { useRef, useEffect, useState } from 'react';
import { Heart, MessageCircle, Share2, Music2, User, Volume2, VolumeX } from 'lucide-react';
import { toggleLikeAction } from '@/app/actions/social';
import { createClient } from '@/utils/supabase/client';
import CommentModal from './CommentModal';
import ShareModal from './ShareModal';

interface ReelCardProps {
  post: {
    id: string;
    content: string;
    mediaUrl: string;
    likes: number;
    comments: number;
    author: {
      id: string;
      name: string;
      username: string;
      avatar: string;
    }
  };
  isActive: boolean;
}

export default function ReelCard({ post, isActive }: ReelCardProps) {
  const supabase = createClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [isMuted, setIsMuted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    const savedMute = localStorage.getItem('reels_muted');
    if (savedMute !== null) {
      setIsMuted(savedMute === 'true');
    }
  }, []);

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    localStorage.setItem('reels_muted', String(nextMuted));
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
      
      if (data) setLiked(true);
    };
    checkLike();
  }, [post.id]);

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Browser blocked unmuted autoplay
            setIsMuted(true);
            if (videoRef.current) {
              videoRef.current.muted = true;
              videoRef.current.play().catch(e => console.error("Video play failed even muted", e));
            }
          });
        }
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isActive]);

  const handleLike = async () => {
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikesCount(prev => wasLiked ? prev - 1 : prev + 1);
    const res = await toggleLikeAction(post.id);
    if (!res.success) {
      setLiked(wasLiked);
      setLikesCount(prev => wasLiked ? prev + 1 : prev - 1);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Check out this reel on Indico',
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

  return (
    <div style={{
      height: 'calc(100vh - 120px)',
      maxHeight: '800px',
      width: '100%',
      backgroundColor: '#000',
      borderRadius: '20px',
      position: 'relative',
      overflow: 'hidden',
      scrollSnapAlign: 'start',
      marginBottom: '20px'
    }}>
      <video
        ref={videoRef}
        src={post.mediaUrl}
        loop
        playsInline
        muted={!isActive || isMuted}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        onClick={toggleMute}
      />

      {/* Mute Toggle Overlay */}
      <button 
        onClick={toggleMute}
        style={{
          position: 'absolute', top: '20px', right: '20px',
          background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%',
          padding: '10px', color: 'white', cursor: 'pointer', zIndex: 10
        }}
      >
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>

      {/* Overlay Content */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '20px',
        background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
        color: 'white'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{ 
            width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', 
            border: '2px solid var(--accent-primary)', background: 'var(--bg-secondary)'
          }}>
            {post.author.avatar ? (
              <img src={post.author.avatar} alt={post.author.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={20} />
              </div>
            )}
          </div>
          <div>
            <div style={{ fontWeight: 'bold' }}>{post.author.name}</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>@{post.author.username}</div>
          </div>
          <button className="btn-primary" style={{ padding: '4px 12px', fontSize: '0.8rem', marginLeft: '10px' }}>Follow</button>
        </div>
        
        <p style={{ fontSize: '0.95rem', marginBottom: '12px', lineHeight: '1.4' }}>{post.content}</p>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Music2 size={14} />
            <span>Original Sound</span>
          </div>
        </div>
      </div>

      {/* Side Actions */}
      <div style={{
        position: 'absolute',
        right: '15px',
        bottom: '100px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        alignItems: 'center'
      }}>
        <button onClick={handleLike} style={{ background: 'none', border: 'none', color: liked ? '#ef4444' : 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <div style={{ padding: '10px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
            <Heart size={24} fill={liked ? '#ef4444' : 'none'} />
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{likesCount}</span>
        </button>
        
        <button onClick={() => setShowComments(true)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <div style={{ padding: '10px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
            <MessageCircle size={24} />
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{post.comments}</span>
        </button>

        <button onClick={() => setShowShare(true)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
          <div style={{ padding: '10px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
            <Share2 size={24} />
          </div>
        </button>
      </div>

      {showComments && (
        <CommentModal postId={post.id} onClose={() => setShowComments(false)} />
      )}

      {showShare && (
        <ShareModal postId={post.id} onClose={() => setShowShare(false)} />
      )}
    </div>
  );
}
