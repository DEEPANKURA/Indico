'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Music, Play, Pause, X, Loader2, Check } from 'lucide-react';

interface Track {
  id: string;
  name: string;
  artist_name: string;
  audio: string;
  image: string;
  duration: number;
}

interface MusicSelectorProps {
  onSelect: (track: Track | null) => void;
  onClose: () => void;
}

const JAMENDO_CLIENT_ID = '709fa152';

export default function MusicSelector({ onSelect, onClose }: MusicSelectorProps) {
  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const searchMusic = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_CLIENT_ID}&format=jsonpretty&limit=20&search=${encodeURIComponent(q)}&include=musicinfo&audioformat=mp32`);
      const data = await res.json();
      setTracks(data.results || []);
    } catch (error) {
      console.error('Jamendo error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Featured music on mount
  useEffect(() => {
    const loadFeatured = async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_CLIENT_ID}&format=jsonpretty&limit=10&order=boostratio_month&audioformat=mp32`);
        const data = await res.json();
        setTracks(data.results || []);
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
        audioRef.current.play();
        setPlayingId(track.id);
      }
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 20000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <audio ref={audioRef} onEnded={() => setPlayingId(null)} />
      
      <div style={{
        width: '100%', maxWidth: '500px', background: 'var(--bg-secondary)',
        borderRadius: '24px', border: '1px solid var(--border-light)',
        display: 'flex', flexDirection: 'column', height: '80vh',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)', overflow: 'hidden',
        animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Music size={18} color="white" />
            </div>
            <h3 style={{ margin: 0, fontWeight: '800' }}>Add Music</h3>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '16px 20px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '32px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Search tracks, artists, genres..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              // Debounced search could be added here
            }}
            onKeyDown={(e) => e.key === 'Enter' && searchMusic(query)}
            style={{
              width: '100%', padding: '12px 12px 12px 42px', borderRadius: '12px',
              background: 'var(--bg-glass)', border: '1px solid var(--border-light)',
              color: 'white', outline: 'none', fontSize: '0.95rem'
            }}
          />
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px 20px' }} className="no-scrollbar">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <Loader2 className="animate-spin" color="var(--accent-primary)" />
            </div>
          ) : tracks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              No music found
            </div>
          ) : (
            tracks.map((track) => (
              <div key={track.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                borderRadius: '16px', transition: 'all 0.2s',
                cursor: 'pointer', border: '1px solid transparent'
              }} className="music-item-hover">
                {/* Cover */}
                <div style={{ position: 'relative', width: '50px', height: '50px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                  <img src={track.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleTogglePlay(track); }}
                    style={{
                      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                      background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', border: 'none', opacity: playingId === track.id ? 1 : 0
                    }} className="play-button-hover">
                    {playingId === track.id ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" />}
                  </button>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }} onClick={() => handleTogglePlay(track)}>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.artist_name}</div>
                </div>

                {/* Action */}
                <button 
                  onClick={() => {
                    audioRef.current?.pause();
                    onSelect(track);
                    onClose();
                  }}
                  style={{
                    background: 'var(--accent-primary)', color: 'white', border: 'none',
                    padding: '8px 16px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '800'
                  }}>
                  Select
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
