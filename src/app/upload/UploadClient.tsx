'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Upload, Image as ImageIcon, Video as VideoIcon, Film, X, Loader2, 
  CheckCircle, Music, Volume2, Scissors, Settings2, Sparkles, 
  Type, Filter, Tag, AtSign, ChevronLeft, ChevronRight, Plus, Minus,
  Trash2, Layers, Smile
} from 'lucide-react';
import MusicSelector from '@/components/MusicSelector';
import { uploadMediaAction } from '@/app/actions/post';

type UploadType = 'photo' | 'video' | 'reel';
type Step = 'SELECT' | 'EDIT' | 'POST';

interface OverlayText {
  id: string;
  text: string;
  color: string;
  fontSize: number;
  x: number;
  y: number;
}

const FILTERS = [
  { name: 'Normal', value: 'none' },
  { name: 'Clarendon', value: 'contrast(1.2) brightness(1.1)' },
  { name: 'Moon', value: 'grayscale(1) contrast(1.1)' },
  { name: 'Lark', value: 'brightness(1.1) contrast(1.1) saturate(1.1)' },
  { name: 'Reyes', value: 'sepia(0.3) brightness(1.1) contrast(0.85)' },
  { name: 'Juno', value: 'contrast(1.2) brightness(1.1) saturate(1.4)' },
  { name: 'Aden', value: 'sepia(0.2) brightness(1.15) saturate(0.85)' },
  { name: 'Crema', value: 'sepia(0.1) contrast(1.1) saturate(1.1)' },
];

export default function UploadClient() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  
  const [step, setStep] = useState<Step>('SELECT');
  const [type, setType] = useState<UploadType>('photo');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  
  // Editing State
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [overlays, setOverlays] = useState<OverlayText[]>([]);
  const [activeOverlayId, setActiveOverlayId] = useState<string | null>(null);
  const [showMusicSelector, setShowMusicSelector] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<any>(null);
  const [musicVolume, setMusicVolume] = useState(0.5);
  const [videoVolume, setVideoVolume] = useState(1.0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  
  // Post processing State
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [mentions, setMentions] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [mentionInput, setMentionInput] = useState('');

  // Upload State
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const acceptMap: Record<UploadType, string> = {
    photo: 'image/*',
    video: 'video/*',
    reel: 'video/*',
  };

  const handleFile = (f: File) => {
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
    setStep('EDIT');
    setError(null);
    setSelectedMusic(null);
    setOverlays([]);
    setSelectedFilter('none');
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

  const addTextOverlay = () => {
    const newOverlay: OverlayText = {
      id: Math.random().toString(36).substring(7),
      text: 'Double tap to edit',
      color: '#ffffff',
      fontSize: 24,
      x: 50,
      y: 50
    };
    setOverlays([...overlays, newOverlay]);
    setActiveOverlayId(newOverlay.id);
  };

  const updateOverlay = (id: string, updates: Partial<OverlayText>) => {
    setOverlays(overlays.map(o => o.id === id ? { ...o, ...updates } : o));
  };

  const deleteOverlay = (id: string) => {
    setOverlays(overlays.filter(o => o.id !== id));
    if (activeOverlayId === id) setActiveOverlayId(null);
  };

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
      fd.append('tags', JSON.stringify(tags));
      fd.append('mentions', JSON.stringify(mentions));
      fd.append('overlays', JSON.stringify({
        filter: selectedFilter,
        textItems: overlays
      }));
      
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

  const renderPreview = () => (
    <div 
      ref={previewRef}
      className="editor-preview-container"
      style={{ 
        position: 'relative', 
        width: '100%', 
        aspectRatio: type === 'reel' ? '9/16' : '1/1',
        maxHeight: '70vh',
        backgroundColor: '#000',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        cursor: step === 'EDIT' ? 'crosshair' : 'default',
        margin: '0 auto'
      }}
    >
      <div style={{ width: '100%', height: '100%', filter: selectedFilter, transition: 'filter 0.3s' }}>
        {type === 'photo' ? (
          <img src={preview!} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        ) : (
          <video 
            ref={videoRef} 
            src={preview!} 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
            loop
            playsInline
            onClick={() => {
              if (videoRef.current) {
                if (videoRef.current.paused) videoRef.current.play().catch(() => {});
                else videoRef.current.pause();
              }
            }}
          />
        )}
      </div>

      {/* Text Overlays */}
      {overlays.map((overlay) => (
        <div
          key={overlay.id}
          onMouseDown={(e) => {
            if (step !== 'EDIT') return;
            setActiveOverlayId(overlay.id);
          }}
          style={{
            position: 'absolute',
            left: `${overlay.x}%`,
            top: `${overlay.y}%`,
            transform: 'translate(-50%, -50%)',
            color: overlay.color,
            fontSize: `${overlay.fontSize}px`,
            fontWeight: '900',
            textAlign: 'center',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
            cursor: 'move',
            padding: '8px',
            borderRadius: '8px',
            border: activeOverlayId === overlay.id ? '2px solid var(--accent-secondary)' : '2px solid transparent',
            userSelect: 'none',
            whiteSpace: 'pre-wrap',
            maxWidth: '80%'
          }}
          onDoubleClick={() => {
            const newText = prompt('Edit text:', overlay.text);
            if (newText !== null) updateOverlay(overlay.id, { text: newText });
          }}
        >
          {overlay.text}
        </div>
      ))}

      {step === 'EDIT' && (
        <div style={{ position: 'absolute', bottom: '16px', right: '16px', display: 'flex', gap: '8px' }}>
          <button 
            onClick={addTextOverlay}
            style={{ background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', backdropFilter: 'blur(8px)' }}
          >
            <Type size={20} />
          </button>
        </div>
      )}
    </div>
  );

  const renderSelectStep = () => (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '32px', flexWrap: 'wrap' }}>
        {(['photo', 'video', 'reel'] as UploadType[]).map((t) => (
          <button 
            key={t}
            onClick={() => { setType(t); setFile(null); setPreview(null); }}
            style={{
              padding: '16px 20px',
              borderRadius: '20px',
              border: '1px solid var(--border-light)',
              background: type === t ? 'var(--accent-secondary)22' : 'var(--bg-glass)',
              color: type === t ? 'var(--accent-secondary)' : 'var(--text-secondary)',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              width: '100px',
              transition: 'all 0.2s'
            }}
          >
            {t === 'photo' ? <ImageIcon size={24} /> : t === 'video' ? <VideoIcon size={24} /> : <Film size={24} />}
            <span style={{ textTransform: 'capitalize', fontSize: '0.8rem' }}>{t}</span>
          </button>
        ))}
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        style={{
          border: `3px dashed ${dragging ? 'var(--accent-secondary)' : 'var(--border-light)'}`,
          borderRadius: '32px', padding: '60px 20px',
          background: dragging ? 'rgba(139,92,246,0.05)' : 'var(--bg-glass)',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
          <Upload size={28} style={{ color: 'var(--text-secondary)' }} />
        </div>
        <h2 style={{ fontWeight: '900', fontSize: '1.5rem', marginBottom: '8px' }}>Upload Content</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>Drag and drop or click to browse</p>
        <button className="btn-primary" style={{ padding: '12px 32px', borderRadius: '14px', fontSize: '1rem' }}>Browse Files</button>
        <input type="file" ref={fileRef} hidden accept={acceptMap[type]} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </div>
    </div>
  );

  const renderEditStep = () => (
    <div className="studio-layout" style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
      gap: '24px',
      paddingBottom: '80px'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {renderPreview()}
        
        {/* Filter List */}
        <div style={{ padding: '20px', borderRadius: '24px', background: 'var(--bg-glass)', border: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Filter size={18} style={{ color: 'var(--accent-secondary)' }} />
            <h3 style={{ fontWeight: '800', fontSize: '1rem', margin: 0 }}>Filters</h3>
          </div>
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '10px' }} className="no-scrollbar">
            {FILTERS.map((f) => (
              <button
                key={f.name}
                onClick={() => setSelectedFilter(f.value)}
                style={{
                  flexShrink: 0,
                  width: '80px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <div style={{ 
                  width: '64px', height: '64px', borderRadius: '12px', overflow: 'hidden',
                  border: selectedFilter === f.value ? '3px solid var(--accent-secondary)' : '2px solid transparent',
                  padding: '2px'
                }}>
                  <div style={{ width: '100%', height: '100%', borderRadius: '8px', background: '#333', filter: f.value }}>
                    {preview && <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: selectedFilter === f.value ? 'var(--accent-secondary)' : 'var(--text-secondary)' }}>{f.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Text Overlay Controls */}
        {activeOverlayId && (
          <div className="glass-card" style={{ padding: '20px', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Type size={18} />
                <h3 style={{ fontWeight: '800', margin: 0, fontSize: '0.9rem' }}>Text Styles</h3>
              </div>
              <button onClick={() => deleteOverlay(activeOverlayId)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                <Trash2 size={18} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Color</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['#ffffff', '#000000', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'].map(c => (
                    <button
                      key={c}
                      onClick={() => updateOverlay(activeOverlayId, { color: c })}
                      style={{ width: '24px', height: '24px', borderRadius: '50%', background: c, border: overlays.find(o => o.id === activeOverlayId)?.color === c ? '2px solid var(--accent-secondary)' : '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}
                    />
                  ))}
                </div>
              </div>
              
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Size</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button onClick={() => updateOverlay(activeOverlayId, { fontSize: Math.max(12, (overlays.find(o => o.id === activeOverlayId)?.fontSize || 24) - 2) })} style={{ background: 'var(--bg-secondary)', border: 'none', borderRadius: '8px', padding: '4px' }}><Minus size={16}/></button>
                  <span style={{ fontWeight: '700', minWidth: '30px', textAlign: 'center' }}>{overlays.find(o => o.id === activeOverlayId)?.fontSize}</span>
                  <button onClick={() => updateOverlay(activeOverlayId, { fontSize: Math.min(72, (overlays.find(o => o.id === activeOverlayId)?.fontSize || 24) + 2) })} style={{ background: 'var(--bg-secondary)', border: 'none', borderRadius: '8px', padding: '4px' }}><Plus size={16}/></button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Music & Audio */}
        <div className="glass-card" style={{ padding: '20px', borderRadius: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Music size={18} style={{ color: '#ec4899' }} />
              <h3 style={{ fontWeight: '800', margin: 0, fontSize: '0.9rem' }}>Audio</h3>
            </div>
            <button 
              onClick={() => setShowMusicSelector(true)}
              style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {selectedMusic ? 'Change' : 'Add Music'}
            </button>
          </div>

          {selectedMusic && (
            <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '12px', background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.2)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Music size={16} color="white" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: '800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedMusic.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{selectedMusic.artist_name}</div>
              </div>
              <button onClick={() => setSelectedMusic(null)}><X size={14} /></button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: '700' }}>Music Volume</span>
                <span style={{ fontSize: '0.7rem' }}>{Math.round(musicVolume * 100)}%</span>
              </div>
              <input type="range" min="0" max="1" step="0.05" value={musicVolume} onChange={(e) => setMusicVolume(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#ec4899' }} />
            </div>
            {type !== 'photo' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: '700' }}>Original Audio</span>
                  <span style={{ fontSize: '0.7rem' }}>{Math.round(videoVolume * 100)}%</span>
                </div>
                <input type="range" min="0" max="1" step="0.05" value={videoVolume} onChange={(e) => setVideoVolume(parseFloat(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent-secondary)' }} />
              </div>
            )}
          </div>
        </div>

        {/* Trim Tool */}
        {type !== 'photo' && videoDuration > 0 && (
          <div className="glass-card" style={{ padding: '20px', borderRadius: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Scissors size={18} style={{ color: 'var(--accent-secondary)' }} />
              <h3 style={{ fontWeight: '800', margin: 0, fontSize: '0.9rem' }}>Trim Video</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.7rem' }}>Start: {trimStart.toFixed(1)}s</span>
                  <span style={{ fontSize: '0.7rem' }}>End: {trimEnd.toFixed(1)}s</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input 
                    type="range" min="0" max={videoDuration} step="0.1" value={trimStart} 
                    onChange={(e) => setTrimStart(Math.min(parseFloat(e.target.value), trimEnd - 1))} 
                    style={{ width: '100%', accentColor: 'var(--accent-secondary)' }} 
                  />
                </div>
                <input 
                  type="range" min="0" max={videoDuration} step="0.1" value={trimEnd} 
                  onChange={(e) => setTrimEnd(Math.max(parseFloat(e.target.value), trimStart + 1))} 
                  style={{ width: '100%', accentColor: 'var(--accent-secondary)' }} 
                />
              </div>
            </div>
          </div>
        )}

        <button 
          onClick={() => setStep('POST')}
          className="btn-primary" 
          style={{ padding: '18px', borderRadius: '16px', fontWeight: '900', fontSize: '1.1rem', boxShadow: '0 10px 20px rgba(139,92,246,0.3)' }}
        >
          Next Step
        </button>
      </div>
    </div>
  );

  const renderPostStep = () => (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
        <div style={{ position: 'sticky', top: '20px' }}>
          {renderPreview()}
        </div>
        
        <div className="glass-card" style={{ padding: '24px', borderRadius: '24px' }}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '8px' }}>Caption</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption..."
              style={{
                width: '100%', height: '120px', padding: '16px', borderRadius: '16px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)',
                color: 'white', fontSize: '0.95rem', resize: 'none', outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent-secondary)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-light)'}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              <Tag size={16} /> Tags
            </label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              {tags.map(t => (
                <span key={t} style={{ padding: '4px 10px', borderRadius: '8px', background: 'var(--accent-secondary)22', color: 'var(--accent-secondary)', fontSize: '0.8rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  #{t} <X size={12} style={{ cursor: 'pointer' }} onClick={() => setTags(tags.filter(x => x !== t))} />
                </span>
              ))}
            </div>
            <div style={{ position: 'relative' }}>
              <input 
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && tagInput) {
                    setTags([...tags, tagInput.replace('#', '')]);
                    setTagInput('');
                  }
                }}
                placeholder="Add tag and press Enter..."
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)', color: 'white', fontSize: '0.9rem' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              <AtSign size={16} /> Mentions
            </label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              {mentions.map(m => (
                <span key={m} style={{ padding: '4px 10px', borderRadius: '8px', background: 'var(--accent-primary)22', color: 'var(--accent-primary)', fontSize: '0.8rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  @{m} <X size={12} style={{ cursor: 'pointer' }} onClick={() => setMentions(mentions.filter(x => x !== m))} />
                </span>
              ))}
            </div>
            <input 
              value={mentionInput}
              onChange={(e) => setMentionInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && mentionInput) {
                  setMentions([...mentions, mentionInput.replace('@', '')]);
                  setMentionInput('');
                }
              }}
              placeholder="Mention users..."
              style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)', color: 'white', fontSize: '0.9rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => setStep('EDIT')}
              style={{ flex: 1, padding: '14px', borderRadius: '14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', color: 'var(--text-primary)', fontWeight: '800', cursor: 'pointer' }}
            >
              Back
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="btn-primary"
              style={{ flex: 2, padding: '14px', borderRadius: '14px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {uploading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
              {uploading ? 'Processing...' : `Share Post`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (done) {
    return (
      <div style={{ maxWidth: '680px', margin: '0 auto', paddingTop: '100px', textAlign: 'center' }}>
        <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', border: '4px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
          <CheckCircle size={48} style={{ color: '#10b981' }} />
        </div>
        <h1 style={{ fontWeight: '900', fontSize: '2.5rem', marginBottom: '16px' }}>Shared Successfully!</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Your premium content is now live. Redirecting to Studio...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
          <ChevronLeft size={20} /> Back
        </button>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '900' }}>{step === 'SELECT' ? 'Create New' : step === 'EDIT' ? 'Studio Edit' : 'Finalize Post'}</h1>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '700', marginTop: '4px' }}>Step {step === 'SELECT' ? '1' : step === 'EDIT' ? '2' : '3'} of 3</div>
        </div>
        <div style={{ width: '60px' }} />
      </div>

      {error && (
        <div className="glass-card" style={{ padding: '16px', borderRadius: '16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AlertCircle size={20} />
          <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{error}</span>
        </div>
      )}

      {step === 'SELECT' && renderSelectStep()}
      {step === 'EDIT' && renderEditStep()}
      {step === 'POST' && renderPostStep()}

      {showMusicSelector && (
        <MusicSelector 
          onSelect={(m) => { setSelectedMusic(m); setShowMusicSelector(false); }} 
          onClose={() => setShowMusicSelector(false)} 
        />
      )}
    </div>
  );
}
