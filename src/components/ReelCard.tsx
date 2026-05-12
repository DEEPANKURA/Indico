'use client';

import { useRef, useEffect, useState } from 'react';
import { Heart, MessageCircle, Share2, Music2, User, Volume2, VolumeX, Flame } from 'lucide-react';
import { toggleLikeAction } from '@/app/actions/social';
import { boostReelWithCoinsAction } from '@/app/actions/monetize';
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
    isBoosted?: boolean;
    boostCoins?: number;
    author: {
      id: string;
      name: string;
      username: string;
      avatar: string;
    };
    musicUrl?: string;
    musicTitle?: string;
    musicArtist?: string;
    musicStartTime?: number;
    musicVolume?: number;
    videoVolume?: number;
    videoTrimStart?: number;
    videoTrimEnd?: number;
  };
  isActive: boolean;
}

export default function ReelCard({ post, isActive }: ReelCardProps) {
  const supabase = createClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [isBoosted, setIsBoosted] = useState(post.isBoosted || false);
  const [boostCoins, setBoostCoins] = useState(post.boostCoins || 0);
  const [boosting, setBoosting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);


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
        // Set initial volumes
        videoRef.current.volume = post.videoVolume ?? 1.0;
        if (post.videoTrimStart) {
          videoRef.current.currentTime = post.videoTrimStart;
        }

        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.log("Autoplay unmuted blocked, trying muted:", error);
            // If unmuted autoplay fails, try muted
            if (videoRef.current) {
              videoRef.current.muted = true;
              videoRef.current.play().catch(e => console.error("Video play failed even muted", e));
            }
          });
        }

        // Start music if available
        if (post.musicUrl && audioRef.current) {
          audioRef.current.volume = post.musicVolume ?? 0.5;
          audioRef.current.currentTime = post.musicStartTime || 0;
          audioRef.current.play().catch(() => {
            console.log("Music autoplay blocked");
          });
          setIsPlayingMusic(true);
        }
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = post.videoTrimStart || 0;
        if (audioRef.current) {
          audioRef.current.pause();
          setIsPlayingMusic(false);
        }
      }

      // Handle trim end
      videoRef.current.ontimeupdate = () => {
        if (post.videoTrimEnd && videoRef.current && videoRef.current.currentTime >= post.videoTrimEnd) {
          videoRef.current.currentTime = post.videoTrimStart || 0;
        }
      };
    }
  }, [isActive, post.musicUrl]);

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

  const handleBoost = async () => {
    if (boosting) return;
    setBoosting(true);
    // Cost to boost is 100 coins
    const res = await boostReelWithCoinsAction(post.id, 100);
    if (res.success) {
      setIsBoosted(true);
      setBoostCoins(prev => prev + 100);
      alert('🚀 Reel boosted successfully using 100 Coins! Indico Platform earned from boost.');
    } else {
      if (res.error?.includes('Insufficient')) {
        if (confirm('Insufficient Coins to boost reel (Costs 100 coins). Would you like to recharge 100 Coins for ₹80 via secure gateway?')) {
          window.location.href = '/monetize';
        }
      } else {
        alert('Boost failed: ' + res.error);
      }
    }
    setBoosting(false);
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

      {post.musicUrl && (
        <audio ref={audioRef} src={post.musicUrl} loop />
      )}

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
            <span>{post.musicTitle ? `${post.musicTitle} • ${post.musicArtist}` : 'Original Sound'}</span>
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

        {/* Boost Reel Option */}
        <button 
          onClick={handleBoost} 
          disabled={boosting}
          style={{ 
            background: 'none', border: 'none', 
            color: isBoosted ? '#f59e0b' : 'white', 
            cursor: boosting ? 'wait' : 'pointer', 
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
            transition: 'all 0.2s'
          }}
          title="Boost this Reel with 100 Coins"
          className="hover-scale"
        >
          <div style={{ 
            padding: '10px', borderRadius: '50%', 
            background: isBoosted ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.1)', 
            border: isBoosted ? '2px solid #f59e0b' : 'none',
            backdropFilter: 'blur(10px)',
            boxShadow: isBoosted ? '0 0 15px rgba(245,158,11,0.5)' : 'none'
          }}>
            <Flame size={24} style={{ fill: isBoosted ? '#f59e0b' : 'none' }} className={boosting ? "animate-bounce" : ""} />
          </div>
          <span style={{ fontSize: '0.65rem', fontWeight: '900', color: isBoosted ? '#f59e0b' : 'rgba(255,255,255,0.8)', textTransform: 'uppercase' }}>
            {isBoosted ? `${boostCoins}c` : 'Boost'}
          </span>
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
