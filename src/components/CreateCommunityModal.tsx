'use client';

import { useState } from 'react';
import { X, Loader2, Globe, Lock } from 'lucide-react';
import { createCommunityAction } from '@/app/actions/communities';

interface CreateCommunityModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateCommunityModal({ onClose, onSuccess }: CreateCommunityModalProps) {
  const [loading, setLoading] = useState(false);
  const [showGuidelinesAlert, setShowGuidelinesAlert] = useState(false);
  const [agreedGuidelines, setAgreedGuidelines] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'General',
    isPublic: true,
    color: '#8b5cf6',
    isExclusive: false,
    joinPrice: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (!agreedGuidelines) {
      setShowGuidelinesAlert(true);
      return;
    }

    setLoading(true);
    const res = await createCommunityAction(formData);
    if (res.success) {
      onSuccess();
      onClose();
    } else {
      alert(res.error || 'Failed to create community');
    }
    setLoading(false);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }} onClick={onClose}>
      <div 
        style={{
          width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto',
          background: 'var(--bg-primary)', borderRadius: '24px',
          padding: '24px', position: 'relative',
          border: '1px solid var(--border-light)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        {showGuidelinesAlert && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 1010,
            background: 'var(--bg-primary)',
            display: 'flex', flexDirection: 'column',
            padding: '24px', borderRadius: '24px',
            boxSizing: 'border-box'
          }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: '900', color: 'white', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--accent-neon, #00f0ff)' }}>🛡️</span> Community Guidelines
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px', lineHeight: '1.4' }}>
              As a community owner, you are legally responsible for moderating all content uploaded by your members. To justify platform access and monetization eligibility, you must agree to enforce our policies.
            </p>

            <div style={{
              flex: 1, overflowY: 'auto', padding: '16px', borderRadius: '16px',
              background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)',
              marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '14px'
            }} className="scrollbar-hidden">
              
              <div style={{ paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <strong style={{ color: '#ef4444', fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>🚫 Banned Behaviors</strong>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.4', display: 'block' }}>
                  Hate speech, harassment, violent threats, terrorism, impersonation, scams, spam, or digital piracy are strictly prohibited.
                </span>
              </div>

              <div style={{ paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <strong style={{ color: '#10b981', fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>✓ Allowed Media</strong>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.4', display: 'block' }}>
                  Bikinis, swimwear, beachwear, fitness clothing, fashion modeling, and non-nude artistic photography.
                </span>
              </div>

              <div style={{ paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <strong style={{ color: '#ef4444', fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>✗ Prohibited Media</strong>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.4', display: 'block' }}>
                  Visible genitals, visible nipples, pornography, sexual acts, explicit close-ups, or escort/prostitution promotion.
                </span>
              </div>

              <div>
                <strong style={{ color: 'var(--accent-secondary, #a855f7)', fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>⚖️ Owner Moderation Duties</strong>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.4', display: 'block' }}>
                  You must actively delete prohibited posts in your community. Failure to moderate your channel will lead to immediate deletion of the community and account suspension.
                </span>
              </div>

            </div>

            <label style={{ display: 'flex', gap: '10px', cursor: 'pointer', marginBottom: '20px', alignItems: 'flex-start', userSelect: 'none' }}>
              <input 
                type="checkbox" 
                checked={agreedGuidelines}
                onChange={(e) => setAgreedGuidelines(e.target.checked)}
                style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: 'var(--accent-neon, #00f0ff)' }} 
              />
              <span style={{ fontSize: '0.85rem', color: 'white', lineHeight: '1.4', fontWeight: '600', textAlign: 'left' }}>
                I agree to enforce and uphold Indico's Community Guidelines and Content Policy in my community.
              </span>
            </label>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                type="button"
                onClick={() => setShowGuidelinesAlert(false)}
                className="glass-card"
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid var(--border-light)', color: 'white', fontWeight: '600', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                type="button"
                disabled={!agreedGuidelines || loading}
                onClick={async () => {
                  setShowGuidelinesAlert(false);
                  setLoading(true);
                  const res = await createCommunityAction(formData);
                  if (res.success) {
                    onSuccess();
                    onClose();
                  } else {
                    alert(res.error || 'Failed to create community');
                  }
                  setLoading(false);
                }}
                className="btn-primary"
                style={{ flex: 2, padding: '12px', borderRadius: '12px', color: 'white', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Agree & Create'}
              </button>
            </div>
          </div>
        )}

        <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <X size={24} />
        </button>

        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '24px' }}>Create Community</h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-secondary)' }}>COMMUNITY NAME</label>
            <input 
              required
              type="text" 
              placeholder="e.g. Indico Music Lab"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="glass-card"
              style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-light)', color: 'white', background: 'rgba(255,255,255,0.05)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-secondary)' }}>DESCRIPTION</label>
            <textarea 
              rows={3}
              placeholder="What is this community about?"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="glass-card"
              style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-light)', color: 'white', background: 'rgba(255,255,255,0.05)', resize: 'none' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-secondary)' }}>CATEGORY</label>
              <select 
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="glass-card"
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-light)', color: 'white', background: 'rgba(255,255,255,0.05)' }}
              >
                <option value="General">General</option>
                <option value="Music">Music</option>
                <option value="Art">Art</option>
                <option value="Gaming">Gaming</option>
                <option value="Tech">Tech</option>
                <option value="Fitness">Fitness</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-secondary)' }}>THEME COLOR</label>
              <input 
                type="color" 
                value={formData.color}
                onChange={(e) => setFormData({...formData, color: e.target.value})}
                style={{ width: '100%', height: '45px', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-light)', background: 'rgba(255,255,255,0.05)', cursor: 'pointer' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)' }}>
            <button 
              type="button"
              onClick={() => setFormData({...formData, isPublic: true, isExclusive: false})}
              style={{ 
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                background: formData.isPublic ? 'var(--accent-primary)' : 'transparent',
                color: 'white', fontWeight: '600', transition: 'all 0.2s'
              }}
            >
              <Globe size={18} /> Public
            </button>
            <button 
              type="button"
              onClick={() => setFormData({...formData, isPublic: false})}
              style={{ 
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                background: !formData.isPublic && !formData.isExclusive ? 'var(--accent-secondary)' : 'transparent',
                color: 'white', fontWeight: '600', transition: 'all 0.2s'
              }}
            >
              <Lock size={18} /> Private
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)' }}>
             <div>
               <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>Exclusive Community</div>
               <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Require a direct INR payment to join</div>
             </div>
             <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
               <input 
                 type="checkbox" 
                 checked={formData.isExclusive} 
                 onChange={(e) => setFormData({...formData, isExclusive: e.target.checked, isPublic: false})} 
                 style={{ width: '20px', height: '20px', accentColor: 'var(--accent-neon)' }} 
               />
             </label>
          </div>

          {formData.isExclusive && (
            <div className="animate-fade-in">
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px', color: 'var(--accent-neon)' }}>JOINING PRICE (INR)</label>
              <input 
                required={formData.isExclusive}
                type="number" 
                min="1"
                placeholder="e.g. 50"
                value={formData.joinPrice}
                onChange={(e) => setFormData({...formData, joinPrice: parseInt(e.target.value) || 0})}
                className="glass-card"
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--accent-neon)', color: 'white', background: 'rgba(255,255,255,0.05)' }}
              />
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary" 
            style={{ width: '100%', padding: '14px', borderRadius: '12px', marginTop: '10px', fontSize: '1rem', flexShrink: 0 }}
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Create Community'}
          </button>
        </form>
      </div>
    </div>
  );
}
