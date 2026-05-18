'use client';

import { useRef, useEffect, useState } from 'react';
import { Heart, MessageCircle, Share2, Music2, User, Volume2, VolumeX, Flame, Flag, Bookmark, Loader2 } from 'lucide-react';
import { toggleLikeAction, toggleFollowAction, reportPostAction } from '@/app/actions/social';
import { boostReelWithCoinsAction } from '@/app/actions/monetize';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
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
    initialIsLiked?: boolean;
    initialIsFollowing?: boolean;
    currentUserId?: string | null;
  };
  isActive: boolean;
}

export default function ReelCard({ post, isActive }: ReelCardProps) {
  const supabase = createClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [liked, setLiked] = useState(post.initialIsLiked || false);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [isBoosted, setIsBoosted] = useState(post.isBoosted || false);
  const [isFollowing, setIsFollowing] = useState(post.initialIsFollowing || false);
  const [boostCoins, setBoostCoins] = useState(post.boostCoins || 0);
  const [boosting, setBoosting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(post.currentUserId || null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);


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
    // Skip if data already provided or not logged in
    if (post.initialIsLiked !== undefined || post.currentUserId === null) return;
    
    const checkLike = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCurrentUserId(null);
        return;
      }
      setCurrentUserId(user.id);
      
      const { data } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .single();
      
      if (data) setLiked(true);
    };
    checkLike();
  }, [post.id, post.initialIsLiked, post.currentUserId]);

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

  const handleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUserId) {
      toast.error('Please log in to follow creators.');
      return;
    }
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    const res = await toggleFollowAction(post.author.id);
    if (!res.success) {
      setIsFollowing(wasFollowing);
      toast.error(res.error || 'Failed to toggle follow status');
    } else {
      setIsFollowing(res.following!);
      toast.success(res.following ? `Following @${post.author.username}` : `Unfollowed @${post.author.username}`);
    }
  };

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    if (nextSaved) {
      toast.success('Reel saved to bookmarks!');
    } else {
      toast.success('Reel removed from bookmarks!');
    }
  };

  const handleReport = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const reason = prompt('Reason for reporting (Sexual content, Vulger, Harassment, Porn, Child abuses, Criminal act):');
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

  return (
    <div style={{
      height: '100%',
      width: '100%',
      backgroundColor: '#000',
      position: 'relative',
      overflow: 'hidden',
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
        color: 'white',
        zIndex: 5
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', width: '100%' }}>
          <Link href={`/profile/${post.author.id}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'inherit', flex: 1, minWidth: 0 }}>
            <div style={{ 
              width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', 
              border: '2px solid var(--accent-primary)', background: 'var(--bg-secondary)', flexShrink: 0
            }}>
              {post.author.avatar ? (
                <img src={post.author.avatar} alt={post.author.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={20} />
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <div style={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{post.author.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>@{post.author.username}</span>
                {currentUserId !== post.author.id && (
                  <button 
                    onClick={handleFollow}
                    style={{ 
                      padding: '2px 8px', 
                      fontSize: '0.7rem', 
                      fontWeight: 'bold',
                      borderRadius: '4px',
                      border: isFollowing ? '1px solid rgba(255,255,255,0.4)' : 'none',
                      background: isFollowing ? 'transparent' : 'var(--accent-primary, #6366f1)',
                      color: 'white',
                      cursor: 'pointer',
                      flexShrink: 0,
                      lineHeight: '1.2',
                      transition: 'all 0.2s',
                    }}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>
            </div>
          </Link>
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
        bottom: '80px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        alignItems: 'center',
        zIndex: 10
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

        <button onClick={() => setShowShare(true)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <div style={{ padding: '10px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
            <Share2 size={24} />
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Share</span>
        </button>

        <button onClick={handleSave} style={{ background: 'none', border: 'none', color: isSaved ? '#f59e0b' : 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <div style={{ padding: '10px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: isSaved ? '1px solid #f59e0b' : 'none' }}>
            <Bookmark size={24} fill={isSaved ? '#f59e0b' : 'none'} />
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Save</span>
        </button>

        <button onClick={handleReport} disabled={isReporting} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <div style={{ padding: '10px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
            {isReporting ? <Loader2 size={24} className="animate-spin" /> : <Flag size={24} />}
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Report</span>
        </button>

        {/* Boost Reel Option */}
        {currentUserId === post.author.id && (
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
        )}
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
