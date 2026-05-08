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
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'General',
    isPublic: true,
    color: '#8b5cf6'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

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
          width: '100%', maxWidth: '500px',
          background: 'var(--bg-primary)', borderRadius: '24px',
          padding: '24px', position: 'relative',
          border: '1px solid var(--border-light)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
        }} 
        onClick={(e) => e.stopPropagation()}
      >
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
              onClick={() => setFormData({...formData, isPublic: !formData.isPublic})}
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
              onClick={() => setFormData({...formData, isPublic: !formData.isPublic})}
              style={{ 
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                background: !formData.isPublic ? 'var(--accent-secondary)' : 'transparent',
                color: 'white', fontWeight: '600', transition: 'all 0.2s'
              }}
            >
              <Lock size={18} /> Private
            </button>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary" 
            style={{ width: '100%', padding: '14px', borderRadius: '12px', marginTop: '10px', fontSize: '1rem' }}
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Create Community'}
          </button>
        </form>
      </div>
    </div>
  );
}
