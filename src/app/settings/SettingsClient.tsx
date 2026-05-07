'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, User, Camera, Save, Loader2, LogOut, Bell, Shield, CreditCard } from 'lucide-react';
import { updateProfileAction, uploadAvatarAction } from '@/app/actions/profile';
import { createClient } from '@/utils/supabase/client';

interface Props {
  profile: any;
  email: string;
}

export default function SettingsClient({ profile, email }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null);

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [website, setWebsite] = useState(profile?.website || '');

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Preview
    setAvatarPreview(URL.createObjectURL(file));
    setUploadingAvatar(true);
    const fd = new FormData();
    fd.append('avatar', file);
    const result = await uploadAvatarAction(fd);
    setUploadingAvatar(false);
    if (result.success) {
      setMessage({ type: 'success', text: 'Profile picture updated!' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Upload failed' });
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage(null);
    const fd = new FormData();
    fd.append('full_name', fullName);
    fd.append('username', username);
    fd.append('bio', bio);
    fd.append('website', website);
    const result = await updateProfileAction(fd);
    setSaving(false);
    setMessage(result.success
      ? { type: 'success', text: 'Profile saved successfully!' }
      : { type: 'error', text: result.error || 'Failed to save' });
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth');
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ];

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingTop: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Settings size={28} style={{ color: 'var(--accent-secondary)' }} />
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Settings</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'var(--bg-glass)', padding: '4px', borderRadius: '12px' }}>
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            background: activeTab === tab.id ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' : 'transparent',
            color: 'white', fontWeight: activeTab === tab.id ? '700' : '500', fontSize: '0.85rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
          }}>
            <tab.icon size={16} />
            <span className="hide-on-mobile">{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div className="glass-card" style={{ padding: '24px', borderRadius: '20px' }}>
          {message && (
            <div style={{
              padding: '12px 16px', borderRadius: '10px', marginBottom: '20px',
              background: message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`,
              color: message.type === 'success' ? '#10b981' : '#fca5a5', fontSize: '0.9rem'
            }}>
              {message.text}
            </div>
          )}

          {/* Avatar Upload */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px' }}>
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '88px', height: '88px', borderRadius: '50%',
                background: avatarPreview ? 'none' : 'linear-gradient(135deg, var(--accent-primary), var(--accent-neon))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2.5rem', fontWeight: '800', color: 'white',
                border: '3px solid var(--accent-secondary)',
                overflow: 'hidden', boxShadow: 'var(--shadow-neon)'
              }}>
                {avatarPreview
                  ? <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : (fullName || 'U')[0]?.toUpperCase()
                }
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadingAvatar}
                style={{
                  position: 'absolute', bottom: '-2px', right: '-2px',
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: 'var(--accent-secondary)', border: '2px solid var(--bg-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                }}
              >
                {uploadingAvatar ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} color="white" />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>{fullName || 'Your Name'}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>@{username || 'username'}</div>
              <button onClick={() => fileRef.current?.click()} style={{ marginTop: '6px', color: 'var(--accent-secondary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}>
                Change photo
              </button>
            </div>
          </div>

          {/* Form fields */}
          {[
            { label: 'Full Name', value: fullName, setter: setFullName, placeholder: 'Your full name' },
            { label: 'Username', value: username, setter: setUsername, placeholder: '@username' },
            { label: 'Website', value: website, setter: setWebsite, placeholder: 'https://yourwebsite.com' },
          ].map((field) => (
            <div key={field.label} style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>{field.label}</label>
              <input
                suppressHydrationWarning
                type="text"
                value={field.value}
                onChange={(e) => field.setter(e.target.value)}
                placeholder={field.placeholder}
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: '10px', boxSizing: 'border-box',
                  background: 'var(--bg-glass)', border: '1px solid var(--border-light)',
                  color: 'white', outline: 'none', fontSize: '0.95rem'
                }}
              />
            </div>
          ))}

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontWeight: '600', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell the world about yourself..."
              maxLength={160}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '10px', minHeight: '100px',
                background: 'var(--bg-glass)', border: '1px solid var(--border-light)',
                color: 'white', outline: 'none', fontSize: '0.95rem', resize: 'none',
                fontFamily: 'inherit', boxSizing: 'border-box'
              }}
            />
            <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{bio.length}/160</div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              <span style={{ fontWeight: '600', color: 'white' }}>Email: </span>{email}
            </label>
          </div>

          <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
            <button onClick={handleSaveProfile} disabled={saving} className="btn-primary" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button onClick={handleSignOut} style={{
              padding: '12px 20px', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.4)',
              background: 'rgba(239,68,68,0.1)', color: '#fca5a5', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600'
            }}>
              <LogOut size={18} /> Sign Out
            </button>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="glass-card" style={{ padding: '24px', borderRadius: '20px' }}>
          <h2 style={{ fontWeight: '700', marginBottom: '20px' }}>Notification Preferences</h2>
          {[
            { label: 'New followers', desc: 'When someone follows you' },
            { label: 'Likes on posts', desc: 'When someone likes your content' },
            { label: 'Comments', desc: 'When someone comments on your posts' },
            { label: 'Mentions', desc: 'When someone mentions @you' },
            { label: 'Tips received', desc: 'When a creator sends you a tip' },
            { label: 'Algorithm picks', desc: 'When your post gets featured by AI' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: i < 5 ? '1px solid var(--border-light)' : 'none' }}>
              <div>
                <div style={{ fontWeight: '600' }}>{item.label}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.desc}</div>
              </div>
              <div style={{ width: '44px', height: '24px', borderRadius: '12px', background: i % 2 === 0 ? 'var(--accent-secondary)' : 'var(--bg-glass)', cursor: 'pointer', position: 'relative', border: '1px solid var(--border-light)' }}>
                <div style={{ position: 'absolute', top: '2px', left: i % 2 === 0 ? '20px' : '2px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'privacy' && (
        <div className="glass-card" style={{ padding: '24px', borderRadius: '20px' }}>
          <h2 style={{ fontWeight: '700', marginBottom: '20px' }}>Privacy & Safety</h2>
          {[
            { label: 'Private account', desc: 'Only approved followers can see your posts' },
            { label: 'Show online status', desc: 'Let others see when you are active' },
            { label: 'Allow mentions', desc: 'Let anyone mention you in posts' },
            { label: 'AI content moderation', desc: 'Auto-flag potentially harmful content' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: i < 3 ? '1px solid var(--border-light)' : 'none' }}>
              <div>
                <div style={{ fontWeight: '600' }}>{item.label}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.desc}</div>
              </div>
              <div style={{ width: '44px', height: '24px', borderRadius: '12px', background: i === 3 ? 'var(--accent-secondary)' : 'var(--bg-glass)', cursor: 'pointer', position: 'relative', border: '1px solid var(--border-light)' }}>
                <div style={{ position: 'absolute', top: '2px', left: i === 3 ? '20px' : '2px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="glass-card" style={{ padding: '24px', borderRadius: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>💳</div>
          <h2 style={{ fontWeight: '700', marginBottom: '8px' }}>Indico Pro</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Unlock analytics, priority reach, custom themes, and more</p>
          <div style={{ background: 'linear-gradient(135deg, #1a1040, #0d2040)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '16px', padding: '24px', marginBottom: '20px' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '800' }} className="text-gradient">$9.99<span style={{ fontSize: '1rem', fontWeight: '400', color: 'var(--text-secondary)' }}>/mo</span></div>
            <ul style={{ textAlign: 'left', marginTop: '16px', listStyle: 'none', padding: 0 }}>
              {['Advanced Analytics', 'Priority Algorithm Boost', '10x Upload Limit', 'Custom Profile Theme', 'Verified Creator Badge'].map((f, i) => (
                <li key={i} style={{ padding: '6px 0', color: 'var(--text-secondary)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ color: '#10b981' }}>✓</span> {f}
                </li>
              ))}
            </ul>
          </div>
          <button className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1rem' }}>Upgrade to Pro</button>
        </div>
      )}
    </div>
  );
}
