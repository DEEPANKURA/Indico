'use client';

import { Send, Image as ImageIcon, Loader2, X, Video, Music as MusicIcon, Scissors, ChevronLeft, ChevronRight, Edit3, ShieldCheck } from 'lucide-react';
import { useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { createPostAction } from '@/app/actions/post';
import MusicSelector from './MusicSelector';
import { uploadToCloudinary } from '@/utils/cloudinary';
import { encryptText } from '@/utils/e2ee';

export default function CreatePost({ 
  communityId, 
  onPostCreated 
}: { 
  communityId?: string; 
  onPostCreated?: () => void;
}) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [selectedMusic, setSelectedMusic] = useState<any>(null);
  const [musicStartTime, setMusicStartTime] = useState(0);
  const [showMusicSelector, setShowMusicSelector] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const router = useRouter();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please login to upload media');

      const newUrls: string[] = [];

      for (const file of Array.from(files)) {
        // File size limit: 200MB to reliably handle high-resolution media videos/reels
        if (file.size > 200 * 1024 * 1024) {
          throw new Error(`File "${file.name}" is too large. Maximum size is 200MB.`);
        }

        const secureUrl = await uploadToCloudinary(file, 'posts');
        newUrls.push(secureUrl);
      }

      setMediaUrls(prev => [...prev, ...newUrls]);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload media');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeMedia = (index: number) => {
    setMediaUrls(prev => prev.filter((_, i) => i !== index));
  };

  const moveMedia = (index: number, direction: 'left' | 'right') => {
    const newMedia = [...mediaUrls];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newMedia.length) {
      [newMedia[index], newMedia[targetIndex]] = [newMedia[targetIndex], newMedia[index]];
      setMediaUrls(newMedia);
    }
  };

  const handlePost = async () => {
    if (!content.trim() && mediaUrls.length === 0) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const musicInfo = selectedMusic ? {
        url: selectedMusic.audio,
        title: selectedMusic.name,
        artist: selectedMusic.artist_name,
        startTime: musicStartTime
      } : undefined;

      const finalContent = communityId ? encryptText(content, communityId) : content;

      const result = await createPostAction(finalContent, mediaUrls, communityId, musicInfo);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      setContent('');
      setMediaUrls([]);
      setSelectedMusic(null);
      setMusicStartTime(0);
      
      if (onPostCreated) {
        onPostCreated();
      } else {
        router.refresh();
      }
      
      if (result.isFlagged) {
        alert('Your post was created but flagged for review by our AI safety system.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="glass-card" style={{ padding: '24px', marginBottom: '24px', borderRadius: '24px', border: '1px solid var(--border-light)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Edit3 size={20} color="white" />
          </div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>Create Post</h3>
        </div>
        {communityId && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: '800', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(16,185,129,0.2)' }}>
            <ShieldCheck size={14} /> E2EE Secured
          </div>
        )}
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share something with the world..."
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--border-light)',
          borderRadius: '16px',
          padding: '16px',
          color: 'white',
          resize: 'none',
          minHeight: '120px',
          marginBottom: '16px',
          outline: 'none',
          fontSize: '1rem',
          fontFamily: 'inherit',
          transition: 'border-color 0.2s'
        }}
        className="input-focus-accent"
      />

      {mediaUrls.length > 0 && (
        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '16px' }} className="no-scrollbar">
          {mediaUrls.map((url, i) => (
            <div key={i} style={{ position: 'relative', minWidth: '140px', height: '140px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-light)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
              {url.toLowerCase().match(/\.(mp4|webm|ogg|mov)/) || url.includes('video') ? (
                <video src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
              ) : (
                <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Preview" />
              )}
              
              <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px' }}>
                <button 
                  onClick={() => removeMedia(i)}
                  style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <X size={14} />
                </button>
              </div>

              <div style={{ position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: '12px', backdropFilter: 'blur(4px)' }}>
                <button onClick={() => moveMedia(i, 'left')} disabled={i === 0} style={{ background: 'none', border: 'none', color: 'white', opacity: i === 0 ? 0.3 : 1, cursor: 'pointer' }}>
                  <ChevronLeft size={16} />
                </button>
                <button onClick={() => moveMedia(i, 'right')} disabled={i === mediaUrls.length - 1} style={{ background: 'none', border: 'none', color: 'white', opacity: i === mediaUrls.length - 1 ? 0.3 : 1, cursor: 'pointer' }}>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedMusic && (
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', 
          background: 'rgba(139,92,246,0.05)', borderRadius: '18px',
          marginBottom: '20px', border: '1px solid rgba(139,92,246,0.2)',
          animation: 'fadeIn 0.3s'
        }}>
          <div style={{ position: 'relative', width: '48px', height: '48px', borderRadius: '12px', overflow: 'hidden' }}>
            <img src={selectedMusic.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MusicIcon size={18} color="white" />
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.95rem', fontWeight: '800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedMusic.name}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{selectedMusic.artist_name}</span>
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--border-light)' }} />
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-primary)', fontWeight: '700' }}>
                <Scissors size={12} /> Starts @ {formatTime(musicStartTime)}
              </span>
            </div>
          </div>
          <button onClick={() => setSelectedMusic(null)} style={{ background: 'rgba(0,0,0,0.1)', border: 'none', padding: '8px', borderRadius: '50%', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', padding: '12px 16px', borderRadius: '12px', fontSize: '0.9rem', marginBottom: '16px', border: '1px solid rgba(239,68,68,0.2)' }}>
          {error}
        </div>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            multiple 
            accept="image/*,video/*" 
            style={{ display: 'none' }} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isSubmitting}
            style={{ 
              background: 'rgba(129,140,248,0.1)', border: 'none', color: '#818cf8', 
              cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center', 
              padding: '10px 16px', borderRadius: '14px', fontWeight: '700', fontSize: '0.9rem',
              transition: 'all 0.2s'
            }}
            className="hover-scale"
          >
            {isUploading ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />}
            <span>Media</span>
          </button>
          
          <button 
            onClick={() => setShowMusicSelector(true)}
            disabled={isSubmitting}
            style={{ 
              background: 'rgba(16,185,129,0.1)', border: 'none', color: '#10b981', 
              cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center', 
              padding: '10px 16px', borderRadius: '14px', fontWeight: '700', fontSize: '0.9rem',
              transition: 'all 0.2s'
            }}
            className="hover-scale"
          >
            <MusicIcon size={18} />
            <span>Music</span>
          </button>
        </div>

        <button
          onClick={handlePost}
          disabled={isSubmitting || isUploading || (!content.trim() && mediaUrls.length === 0)}
          className="btn-primary"
          style={{ 
            display: 'flex', gap: '8px', alignItems: 'center', padding: '12px 28px',
            borderRadius: '16px', fontWeight: '800', boxShadow: '0 8px 20px rgba(139,92,246,0.3)',
            opacity: (!content.trim() && mediaUrls.length === 0 || isSubmitting || isUploading) ? 0.5 : 1 
          }}
        >
          {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          <span>Post</span>
        </button>
      </div>

      {showMusicSelector && (
        <MusicSelector 
          onSelect={(track, startTime) => {
            setSelectedMusic(track);
            setMusicStartTime(startTime);
          }} 
          onClose={() => setShowMusicSelector(false)} 
        />
      )}
    </div>
  );
}
