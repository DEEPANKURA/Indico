'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Image, Video, Film, X, Loader2, CheckCircle, Music, Volume2, Scissors, Settings2, Sparkles } from 'lucide-react';
import MusicSelector from '@/components/MusicSelector';
import { uploadMediaAction } from '@/app/actions/post';

type UploadType = 'photo' | 'video' | 'reel';

export default function UploadClient() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [type, setType] = useState<UploadType>('photo');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  // Editing State
  const [showMusicSelector, setShowMusicSelector] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<any>(null);
  const [musicVolume, setMusicVolume] = useState(0.5);
  const [videoVolume, setVideoVolume] = useState(1.0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);

  const acceptMap: Record<UploadType, string> = {
    photo: 'image/*',
    video: 'video/*',
    reel: 'video/*',
  };

  const handleFile = (f: File) => {
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
    setError(null);
    setSelectedMusic(null);
    setTrimStart(0);
    setTrimEnd(0);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.onloadedmetadata = () => {
        setVideoDuration(videoRef.current?.duration || 0);
        setTrimEnd(videoRef.current?.duration || 0);
      };
    }
  }, [preview]);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(10);
    setError(null);

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('caption', caption);
      fd.append('type', type);
      
      if (selectedMusic) {
        fd.append('music_info', JSON.stringify({
          url: selectedMusic.audio,
          title: selectedMusic.name,
          artist: selectedMusic.artist_name,
          startTime: selectedMusic.startTime || 0,
          volume: musicVolume
        }));
      }

      fd.append('video_editing', JSON.stringify({
        volume: videoVolume,
        trimStart: trimStart,
        trimEnd: trimEnd
      }));

      setProgress(30);
      const res = await uploadMediaAction(fd);
      setProgress(100);

      if (!res.success) throw new Error(res.error);

      setDone(true);
      setTimeout(() => router.push('/studio'), 2000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Upload failed');
      setUploading(false);
    }
  };

  const tabs: { id: UploadType; label: string; icon: any; color: string }[] = [
    { id: 'photo', label: 'Photo', icon: Image, color: '#8b5cf6' },
    { id: 'video', label: 'Video', icon: Video, color: '#06b6d4' },
    { id: 'reel', label: 'Reel', icon: Film, color: '#ec4899' },
  ];

  if (done) {
    return (
      <div style={{ maxWidth: '680px', margin: '0 auto', paddingTop: '60px', textAlign: 'center' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '2px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <CheckCircle size={40} style={{ color: '#10b981' }} />
        </div>
        <h2 style={{ fontWeight: '800', fontSize: '1.5rem', marginBottom: '8px' }}>Uploaded Successfully!</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Your content is being processed. Redirecting to Studio...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', paddingBottom: '100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ padding: '10px', borderRadius: '12px', background: 'var(--accent-secondary)22' }}>
          <Upload size={28} style={{ color: 'var(--accent-secondary)' }} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '900', margin: 0 }}>Studio Upload</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Create premium content for your audience</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => { setType(tab.id); setFile(null); setPreview(null); }} style={{
                flex: 1, padding: '12px', borderRadius: '14px', border: `1px solid ${type === tab.id ? tab.color : 'var(--border-light)'}`,
                background: type === tab.id ? `${tab.color}22` : 'var(--bg-glass)',
                color: type === tab.id ? tab.color : 'var(--text-secondary)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                fontWeight: '700', fontSize: '0.9rem', transition: 'all 0.2s'
              }}>
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>

          {!preview ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? 'var(--accent-secondary)' : 'var(--border-light)'}`,
                borderRadius: '24px', padding: '80px 24px',
                textAlign: 'center', cursor: 'pointer',
                background: dragging ? 'rgba(139,92,246,0.05)' : 'var(--bg-glass)',
                transition: 'all 0.2s',
                aspectRatio: type === 'reel' ? '9/16' : '16/9',
                maxHeight: '500px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <Upload size={32} style={{ color: 'var(--text-secondary)' }} />
              </div>
              <p style={{ fontWeight: '800', fontSize: '1.2rem', marginBottom: '8px' }}>
                Drop your {type} here
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
                High quality {type === 'photo' ? 'images' : 'vertical videos'} perform best
              </p>
              <span className="btn-primary" style={{ padding: '12px 32px', fontSize: '0.95rem' }}>
                Browse Files
              </span>
            </div>
          ) : (
            <div className="glass-card" style={{ borderRadius: '24px', overflow: 'hidden', background: '#000', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', aspectRatio: type === 'reel' ? '9/16' : '16/9', maxHeight: '500px' }}>
                {type === 'photo'
                  ? <img src={preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  : <video 
                      ref={videoRef} 
                      src={preview} 
                      style={{ width: '100%', height: '100%' }} 
                      onClick={() => {
                        if (videoRef.current) {
                          if (videoRef.current.paused) videoRef.current.play().catch(() => {});
                          else videoRef.current.pause();
                        }
                      }} 
                    />
                }
              </div>
              
              {type !== 'photo' && videoDuration > 0 && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: 'rgba(255,255,255,0.2)' }}>
                   <div style={{ 
                     position: 'absolute', 
                     left: `${(trimStart / videoDuration) * 100}%`, 
                     width: `${Math.max(0, (trimEnd - trimStart) / videoDuration) * 100}%`,
                     height: '100%',
                     background: 'var(--accent-secondary)'
                   }} />
                </div>
              )}

              <button onClick={() => { setFile(null); setPreview(null); }} style={{
                position: 'absolute', top: '16px', right: '16px',
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                backdropFilter: 'blur(10px)'
              }}>
                <X size={20} />
              </button>
            </div>
          )}

          {preview && (
            <div className="glass-card" style={{ padding: '24px', borderRadius: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <Settings2 size={20} style={{ color: 'var(--accent-primary)' }} />
                <h3 style={{ fontWeight: '800', margin: 0 }}>Editing Tools</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
                      <Music size={18} style={{ color: '#ec4899' }} /> Music
                    </div>
                    <button 
                      onClick={() => setShowMusicSelector(true)}
                      style={{ fontSize: '0.85rem', color: 'var(--accent-secondary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700' }}
                    >
                      {selectedMusic ? 'Change Track' : 'Add Music'}
                    </button>
                  </div>

                  {selectedMusic ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Music size={20} color="white" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '700', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedMusic.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{selectedMusic.artist_name}</div>
                      </div>
                      <button onClick={() => setSelectedMusic(null)} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Choose a background track to enhance your {type}.</p>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '0.85rem', fontWeight: '700' }}>
                      <Volume2 size={16} /> {type === 'photo' ? 'Background Volume' : 'Music Volume'}
                    </div>
                    <input 
                      type="range" min="0" max="1" step="0.05"
                      value={musicVolume} onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                    />
                    <div style={{ textAlign: 'right', fontSize: '0.7rem', marginTop: '4px', opacity: 0.6 }}>{Math.round(musicVolume * 100)}%</div>
                  </div>

                  {type !== 'photo' && (
                    <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '0.85rem', fontWeight: '700' }}>
                        <Volume2 size={16} /> Original Audio
                      </div>
                      <input 
                        type="range" min="0" max="1" step="0.05"
                        value={videoVolume} onChange={(e) => setVideoVolume(parseFloat(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--accent-secondary)' }}
                      />
                      <div style={{ textAlign: 'right', fontSize: '0.7rem', marginTop: '4px', opacity: 0.6 }}>{Math.round(videoVolume * 100)}%</div>
                    </div>
                  )}
                </div>

                {type !== 'photo' && videoDuration > 0 && (
                  <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '0.85rem', fontWeight: '700' }}>
                      <Scissors size={16} /> Trim {type === 'reel' ? 'Clip' : 'Video'}
                    </div>
                    <div style={{ position: 'relative', height: '24px', margin: '0 10px' }}>
                      <div style={{ position: 'absolute', top: '10px', left: 0, right: 0, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }} />
                      <input 
                        type="range" min="0" max={videoDuration} step="0.1"
                        value={trimStart} onChange={(e) => setTrimStart(Math.min(parseFloat(e.target.value), trimEnd - 0.5))}
                        style={{ position: 'absolute', width: '100%', top: 0, zIndex: 2, accentColor: 'var(--accent-primary)' }}
                      />
                      <input 
                        type="range" min="0" max={videoDuration} step="0.1"
                        value={trimEnd} onChange={(e) => setTrimEnd(Math.max(parseFloat(e.target.value), trimStart + 0.5))}
                        style={{ position: 'absolute', width: '100%', top: 0, zIndex: 1, accentColor: 'var(--accent-secondary)' }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', fontSize: '0.75rem', fontWeight: '600' }}>
                      <div style={{ color: 'var(--accent-primary)' }}>Start: {trimStart.toFixed(1)}s</div>
                      <div style={{ color: 'var(--text-muted)' }}>Duration: {(trimEnd - trimStart).toFixed(1)}s</div>
                      <div style={{ color: 'var(--accent-secondary)' }}>End: {trimEnd.toFixed(1)}s</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-card" style={{ padding: '20px', borderRadius: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '16px' }}>Post Details</h3>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Caption</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Share the story behind this..."
                style={{
                  width: '100%', height: '120px', padding: '12px', borderRadius: '12px',
                  background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-light)',
                  color: 'white', fontSize: '0.9rem', resize: 'none', outline: 'none'
                }}
              />
            </div>
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="btn-primary"
              style={{ width: '100%', padding: '14px', borderRadius: '14px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {uploading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
              {uploading ? 'Processing...' : `Share to Feed`}
            </button>
          </div>
        </div>
      </div>

      <input ref={fileRef} type="file" accept={acceptMap[type]} style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

      {showMusicSelector && (
        <MusicSelector 
          onSelect={(track, startTime) => {
            if (track) {
              setSelectedMusic({ ...track, startTime });
            } else {
              setSelectedMusic(null);
            }
            setShowMusicSelector(false);
          }} 
          onClose={() => setShowMusicSelector(false)} 
        />
      )}

      {error && (
        <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', padding: '12px 24px', borderRadius: '12px', background: '#ef4444', color: 'white', zIndex: 1000, boxShadow: '0 4px 20px rgba(0,0,0,0.3)', fontWeight: '700' }}>
          {error}
        </div>
      )}

      {uploading && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '300px', textAlign: 'center' }}>
            <Loader2 size={48} className="animate-spin" style={{ color: 'var(--accent-primary)', marginBottom: '24px' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '12px' }}>Finalizing Content</h3>
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent-primary)', transition: 'width 0.3s ease' }} />
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{progress}% Complete</p>
          </div>
        </div>
      )}
    </div>
  );
}
