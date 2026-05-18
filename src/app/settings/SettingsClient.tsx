'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, User, Camera, Save, Loader2, LogOut, Bell, Shield, CreditCard, ShieldAlert, FileText, BookOpen } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { uploadToCloudinary } from '@/utils/cloudinary';

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

    // Set local preview immediately for optimistic UI
    const localUrl = URL.createObjectURL(file);
    setAvatarPreview(localUrl);
    setUploadingAvatar(true);
    setMessage(null);

    try {
      const secureUrl = await uploadToCloudinary(file, 'avatars');
      const avatarUrlWithVersion = `${secureUrl}?v=${Date.now()}`;
      
      const { updateAvatarUrlAction } = await import('@/app/actions/profile');
      const result = await updateAvatarUrlAction(avatarUrlWithVersion);
      
      if (result.success) {
        setAvatarPreview(avatarUrlWithVersion);
        setMessage({ type: 'success', text: 'Profile picture updated!' });
        router.refresh();
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      console.error('Avatar upload failed:', err);
      setMessage({ type: 'error', text: err.message || 'Avatar upload failed' });
      setAvatarPreview(profile?.avatar_url || null);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.append('full_name', fullName);
      fd.append('username', username);
      fd.append('bio', bio);
      fd.append('website', website);
      const { updateProfileAction } = await import('@/app/actions/profile');
      const result = await updateProfileAction(fd);
      if (result.success) {
        setMessage({ type: 'success', text: 'Profile saved successfully!' });
        router.refresh();
      } else {
        setMessage({ type: 'error', text: (result as any).error || 'Failed to save' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Connection error' });
    } finally {
      setSaving(false);
    }
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
    { id: 'legal', label: 'Legal & Guidelines', icon: ShieldAlert },
  ];

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingTop: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Settings size={28} style={{ color: 'var(--accent-secondary)' }} />
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Settings</h1>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '4px', 
        marginBottom: '24px', 
        background: 'var(--bg-glass)', 
        padding: '4px', 
        borderRadius: '12px',
        border: '1px solid var(--border-light)',
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}>
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            background: activeTab === tab.id ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' : 'transparent',
            color: activeTab === tab.id ? 'white' : 'var(--text-secondary, #64748b)', fontWeight: activeTab === tab.id ? '700' : '500', fontSize: '0.85rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            minWidth: 'fit-content', whiteSpace: 'nowrap'
          }}>
            <tab.icon size={16} />
            <span>{tab.label}</span>
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

      {activeTab === 'legal' && (
        <div className="glass-card" style={{ padding: '24px', borderRadius: '20px' }}>
          <h2 style={{ fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={22} style={{ color: 'var(--accent-neon, #00f0ff)' }} />
            Platform Policies & Safety
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px', lineHeight: '1.5' }}>
            Indico is dedicated to creator freedom, safe interactions, and transparent privacy compliance. Read our official terms and guidelines below.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { title: 'Terms of Service', desc: 'Read your rights, content ownership licensing, and account policies.', path: '/terms', icon: FileText, color: 'var(--accent-primary, #8a2be2)' },
              { title: 'Privacy Policy', desc: 'Understand what personal records we collect, how we secure payments, and GDPR/DPDPA data compliance.', path: '/privacy', icon: Shield, color: 'var(--accent-secondary, #a855f7)' },
              { title: 'Community Guidelines', desc: 'Learn about zero-tolerance policies on harassment, scams, hate speech, violent threats, and child safety.', path: '/guidelines', icon: BookOpen, color: '#ef4444' },
            ].map((policy, idx) => {
              const PolicyIcon = policy.icon;
              return (
                <div 
                  key={idx}
                  onClick={() => router.push(policy.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    borderRadius: '16px',
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-light)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  className="hover-glow"
                >
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '12px',
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <PolicyIcon size={20} style={{ color: policy.color }} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <strong style={{ fontSize: '0.95rem', color: 'white', display: 'block' }}>{policy.title}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{policy.desc}</span>
                    </div>
                  </div>
                  <span style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '1.2rem', paddingLeft: '8px' }}>→</span>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '28px', padding: '16px', borderRadius: '14px', background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.02)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>
              For support, safe-reporting, or privacy requests:
            </span>
            <a 
              href="mailto:indicosocialprivacy@gmail.com"
              style={{ fontSize: '0.85rem', color: 'var(--accent-neon, #00f0ff)', display: 'block', marginTop: '4px', textDecoration: 'none', fontWeight: 'bold' }}
            >
              indicosocialprivacy@gmail.com
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
