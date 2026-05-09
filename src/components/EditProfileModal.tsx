'use client';

import { useState, useRef } from 'react';
import { Camera, Loader2, X, Check } from 'lucide-react';
import { updateProfileAction, uploadAvatarAction } from '@/app/actions/profile';

interface EditProfileModalProps {
  profile: {
    full_name?: string;
    username?: string;
    bio?: string;
    website?: string;
    avatar_url?: string;
  };
  onClose: () => void;
  onSaved: () => void;
}

export default function EditProfileModal({ profile, onClose, onSaved }: EditProfileModalProps) {
  const [fullName, setFullName] = useState(profile.full_name || '');
  const [username, setUsername] = useState(profile.username || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [website, setWebsite] = useState(profile.website || '');
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url || null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Set local preview immediately for optimistic UI
    const localUrl = URL.createObjectURL(file);
    setAvatarPreview(localUrl);
    setAvatarUploading(true);
    setError(null);
    
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const result = await uploadAvatarAction(fd);
      
      if (result.success) {
        if (result.avatarUrl) {
          setAvatarPreview(`${result.avatarUrl}&t=${Date.now()}`);
        }
      } else {
        setError(result.error || 'Avatar upload failed');
        // Revert preview on error
        setAvatarPreview(profile.avatar_url || null);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setAvatarPreview(profile.avatar_url || null);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('full_name', fullName);
      fd.append('username', username);
      fd.append('bio', bio);
      fd.append('website', website);
      const result = await updateProfileAction(fd);
      if (result.success) {
        setIsSaved(true);
        setTimeout(() => {
          onSaved();
        }, 800);
      } else {
        setError(result.error || 'Failed to save profile changes');
      }
    } catch (err: any) {
      setError(err.message || 'Connection error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--bg-secondary)', border: '1px solid var(--border-light)',
        borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '480px',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: '800' }}>Edit Profile</h2>
          <button onClick={onClose} style={{ color: 'var(--text-secondary)', padding: '4px' }}>
            <X size={22} />
          </button>
        </div>

        {/* Avatar */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <div style={{ position: 'relative', width: '88px', height: '88px' }}>
            {avatarPreview ? (
              <img src={avatarPreview} alt="avatar"
                style={{ width: '88px', height: '88px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent-secondary)' }} />
            ) : (
              <div style={{
                width: '88px', height: '88px', borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-neon))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem', fontWeight: '800', color: 'white',
                border: '3px solid var(--accent-secondary)',
              }}>
                {fullName?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <button onClick={() => fileRef.current?.click()}
              disabled={avatarUploading}
              style={{
                position: 'absolute', bottom: 0, right: 0,
                width: '28px', height: '28px', borderRadius: '50%',
                background: 'var(--accent-primary)', border: '2px solid var(--bg-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'white',
              }}>
              {avatarUploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
          </div>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', borderRadius: '10px', color: '#fca5a5', fontSize: '0.85rem', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {/* Fields */}
        {[
          { label: 'Full Name', value: fullName, set: setFullName, placeholder: 'Your display name' },
          { label: 'Username', value: username, set: setUsername, placeholder: '@username' },
          { label: 'Website', value: website, set: setWebsite, placeholder: 'https://yoursite.com' },
        ].map(({ label, value, set, placeholder }) => (
          <div key={label} style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>{label}</label>
            <input
              value={value}
              onChange={(e) => set(e.target.value)}
              placeholder={placeholder}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: '10px',
                background: 'var(--bg-glass)', border: '1px solid var(--border-light)',
                color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem',
                fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
          </div>
        ))}

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell the world about yourself..."
            maxLength={200}
            style={{
              width: '100%', padding: '12px 14px', borderRadius: '10px',
              background: 'var(--bg-glass)', border: '1px solid var(--border-light)',
              color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem',
              fontFamily: 'inherit', resize: 'none', minHeight: '80px', boxSizing: 'border-box',
            }}
          />
          <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{bio.length}/200</div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
          <button onClick={handleSave} disabled={saving || isSaved} className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: isSaved ? '#10b981' : undefined }}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : isSaved ? <Check size={16} /> : <Check size={16} />}
            {saving ? 'Saving...' : isSaved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
