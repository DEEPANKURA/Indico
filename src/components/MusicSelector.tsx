'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Music, Play, Pause, X, Loader2, Check, Scissors } from 'lucide-react';
import { searchMusicAction, getFeaturedMusicAction } from '@/app/actions/music';

interface Track {
  id: string;
  name: string;
  artist_name: string;
  audio: string;
  image: string;
  duration: number;
}

interface MusicSelectorProps {
  onSelect: (track: Track | null, startTime: number) => void;
  onClose: () => void;
}

export default function MusicSelector({ onSelect, onClose }: MusicSelectorProps) {
  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [startTime, setStartTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const searchMusic = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await searchMusicAction(q);
      if (res.success) {
        setTracks(res.results || []);
      }
    } catch (error) {
      console.error('Jamendo error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadFeatured = async () => {
      setLoading(true);
      try {
        const res = await getFeaturedMusicAction();
        if (res.success) {
          setTracks(res.results || []);
        }
      } catch (error) {
        console.error('Jamendo error:', error);
      } finally {
        setLoading(false);
      }
    };
    loadFeatured();
  }, []);

  const handleTogglePlay = (track: Track) => {
    if (playingId === track.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = track.audio;
        audioRef.current.currentTime = selectedTrack?.id === track.id ? startTime : 0;
        audioRef.current.play();
        setPlayingId(track.id);
      }
    }
  };

  const handleTrackClick = (track: Track) => {
    setSelectedTrack(track);
    setStartTime(0);
    if (playingId !== track.id) {
      handleTogglePlay(track);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)', zIndex: 20000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <audio ref={audioRef} onEnded={() => setPlayingId(null)} />
      
      <div style={{
        width: '100%', maxWidth: '500px', background: 'var(--bg-secondary)',
        borderRadius: '32px', border: '1px solid var(--border-light)',
        display: 'flex', flexDirection: 'column', height: '85vh',
        boxShadow: '0 25px 60px rgba(0,0,0,0.6)', overflow: 'hidden',
        animation: 'scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(139,92,246,0.3)' }}>
              <Music size={20} color="white" />
            </div>
            <h3 style={{ margin: 0, fontWeight: '900', fontSize: '1.2rem', letterSpacing: '-0.02em' }}>Music Library</h3>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {!selectedTrack ? (
          <>
            {/* Search */}
            <div style={{ padding: '20px', position: 'relative' }}>
              <Search size={20} style={{ position: 'absolute', left: '36px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                placeholder="Find the perfect sound..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchMusic(query)}
                style={{
                  width: '100%', padding: '14px 14px 14px 48px', borderRadius: '16px',
                  background: 'var(--bg-glass)', border: '1px solid var(--border-light)',
                  color: 'white', outline: 'none', fontSize: '1rem', transition: 'all 0.2s'
                }}
                className="input-focus-accent"
              />
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 20px' }} className="no-scrollbar">
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', gap: '16px' }}>
                  <Loader2 className="animate-spin" size={32} color="var(--accent-primary)" />
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Exploring tracks...</span>
                </div>
              ) : tracks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                  <Music size={40} style={{ opacity: 0.1, marginBottom: '16px' }} />
                  <p>No music found</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {tracks.map((track) => (
                    <div key={track.id} 
                      onClick={() => handleTrackClick(track)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '14px', padding: '12px',
                        borderRadius: '18px', transition: 'all 0.2s',
                        cursor: 'pointer', border: '1px solid transparent'
                      }} className="hover-glass">
                      {/* Cover */}
                      <div style={{ position: 'relative', width: '56px', height: '56px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                        <img src={track.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                        <div style={{
                          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                          background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', opacity: playingId === track.id ? 1 : 0
                        }}>
                          {playingId === track.id ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" />}
                        </div>
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '700', fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '2px' }}>{track.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.artist_name}</div>
                      </div>

                      {/* Select Button */}
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleTrackClick(track); }}
                        style={{
                          background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--border-light)',
                          padding: '8px 16px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '700'
                        }} className="btn-hover-accent">
                        Select
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Trimming / Selecting Portion */
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <img src={selectedTrack.image} style={{ width: '100px', height: '100px', borderRadius: '20px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }} alt="" />
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: '900' }}>{selectedTrack.name}</h4>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{selectedTrack.artist_name}</p>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Scissors size={16} color="var(--accent-primary)" /> Start position
                </span>
                <span style={{ fontSize: '1rem', fontWeight: '900', color: 'var(--accent-primary)', background: 'rgba(139,92,246,0.1)', padding: '4px 10px', borderRadius: '8px' }}>
                  {formatTime(startTime)}
                </span>
              </div>
              
              <input 
                type="range" 
                min="0" 
                max={selectedTrack.duration} 
                value={startTime} 
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setStartTime(val);
                  if (audioRef.current) {
                    audioRef.current.currentTime = val;
                    if (playingId !== selectedTrack.id) {
                      audioRef.current.play();
                      setPlayingId(selectedTrack.id);
                    }
                  }
                }}
                style={{
                  width: '100%', height: '6px', borderRadius: '3px',
                  appearance: 'none', background: 'rgba(255,255,255,0.1)',
                  outline: 'none', cursor: 'pointer'
                }}
                className="accent-slider"
              />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                <span>0:00</span>
                <span>{formatTime(selectedTrack.duration)}</span>
              </div>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', margin: 0 }}>
              The song will start playing from this point when users view your post.
            </p>

            <div style={{ marginTop: 'auto', display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setSelectedTrack(null)}
                style={{ flex: 1, padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)', color: 'white', fontWeight: '700', cursor: 'pointer' }}
              >
                Back to List
              </button>
              <button 
                onClick={() => {
                  audioRef.current?.pause();
                  onSelect(selectedTrack, startTime);
                  onClose();
                }}
                style={{ flex: 2, padding: '16px', borderRadius: '16px', background: 'var(--accent-primary)', border: 'none', color: 'white', fontWeight: '800', cursor: 'pointer', boxShadow: '0 8px 20px rgba(139,92,246,0.4)' }}
              >
                Confirm Selection
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
