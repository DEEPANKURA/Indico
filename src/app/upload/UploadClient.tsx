'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Image, Video, Film, X, Loader2, CheckCircle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

type UploadType = 'photo' | 'video' | 'reel';

export default function UploadClient() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState<UploadType>('photo');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const supabase = createClient();

  const acceptMap = {
    photo: 'image/*',
    video: 'video/*',
    reel: 'video/*',
  };

  const handleFile = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError(null);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(10);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to upload');

      // 1. Upload to Storage
      const ext = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${ext}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;
      setProgress(60);

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(filePath);

      // 3. Create Post Record
      const { error: postError } = await supabase.from('posts').insert({
        author_id: user.id,
        content: caption,
        media_urls: [publicUrl],
        ai_safety_score: 100,
        is_flagged: false,
      });

      if (postError) throw postError;

      setProgress(100);
      setDone(true);
      setTimeout(() => router.push('/'), 2000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Upload failed');
    } finally {
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
        <p style={{ color: 'var(--text-secondary)' }}>Your {type} has been shared. Redirecting to feed...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingTop: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Upload size={28} style={{ color: 'var(--accent-secondary)' }} />
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Upload</h1>
      </div>

      {/* Type Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => { setType(tab.id); setFile(null); setPreview(null); }} style={{
            flex: 1, padding: '14px', borderRadius: '14px', border: `1px solid ${type === tab.id ? tab.color : 'var(--border-light)'}`,
            background: type === tab.id ? `${tab.color}22` : 'var(--bg-glass)',
            color: type === tab.id ? tab.color : 'var(--text-secondary)',
            cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
            fontWeight: type === tab.id ? '700' : '500', transition: 'all 0.2s'
          }}>
            <tab.icon size={24} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Drop Zone */}
      {!preview ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? 'var(--accent-secondary)' : 'var(--border-light)'}`,
            borderRadius: '20px', padding: '60px 24px',
            textAlign: 'center', cursor: 'pointer',
            background: dragging ? 'rgba(139,92,246,0.05)' : 'var(--bg-glass)',
            transition: 'all 0.2s', marginBottom: '24px'
          }}
        >
          <Upload size={48} style={{ color: 'var(--text-secondary)', marginBottom: '16px' }} />
          <p style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '8px' }}>
            Drag & drop your {type} here
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
            or click to browse from your device
          </p>
          <span className="btn-primary" style={{ padding: '10px 24px', display: 'inline-block' }}>
            Choose File
          </span>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '12px' }}>
            {type === 'photo' ? 'JPG, PNG, WebP up to 5MB' : 'MP4, WebM, MOV up to 100MB'}
          </p>
        </div>
      ) : (
        <div style={{ marginBottom: '24px', position: 'relative' }}>
          <div style={{ borderRadius: '16px', overflow: 'hidden', background: '#000', maxHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {type === 'photo'
              ? <img src={preview} alt="preview" style={{ width: '100%', maxHeight: '400px', objectFit: 'contain' }} />
              : <video src={preview} controls style={{ width: '100%', maxHeight: '400px' }} />
            }
          </div>
          <button onClick={() => { setFile(null); setPreview(null); }} style={{
            position: 'absolute', top: '12px', right: '12px',
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
          }}>
            <X size={18} />
          </button>
        </div>
      )}

      <input ref={fileRef} type="file" accept={acceptMap[type]} style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

      {/* Caption */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Caption
        </label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write a caption for your post..."
          maxLength={2200}
          style={{
            width: '100%', padding: '14px', borderRadius: '12px', minHeight: '100px',
            background: 'var(--bg-glass)', border: '1px solid var(--border-light)',
            color: 'var(--text-primary)', outline: 'none', resize: 'none', fontFamily: 'inherit',
            fontSize: '0.95rem', boxSizing: 'border-box'
          }}
        />
        <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{caption.length}/2200</div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', color: '#fca5a5', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {uploading && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ width: '100%', height: '6px', background: 'var(--border-light)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent-primary)', transition: 'width 0.3s ease' }} />
          </div>
          <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
            Processing: {progress}%
          </p>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="btn-primary"
        style={{ width: '100%', padding: '14px', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', opacity: !file || uploading ? 0.5 : 1 }}
      >
        {uploading ? <><Loader2 size={20} className="animate-spin" /> Uploading...</> : <><Upload size={20} /> Share {type.charAt(0).toUpperCase() + type.slice(1)}</>}
      </button>
    </div>
  );
}
