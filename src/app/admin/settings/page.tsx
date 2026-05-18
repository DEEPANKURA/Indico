import { Settings, Save, AlertTriangle, EyeOff, Radio } from 'lucide-react';
import { logAdminAction } from '@/utils/admin';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {

  const handleSave = async (formData: FormData) => {
    'use server';
    const reg = formData.get('registrations') === 'on';
    const sub = formData.get('subscriptions') === 'on';
    const size = formData.get('maxSize') as string;

    await logAdminAction(
      'indicosocialprivacy@gmail.com',
      'SETTINGS_UPDATE',
      `Config updated: Registrations enabled: ${reg}, Subscriptions: ${sub}, Max upload resolution: ${size}MB.`
    );
    revalidatePath('/admin/settings');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'white', margin: '0 0 6px 0', letterSpacing: '-0.025em' }}>
          Global Settings & Controls
        </h1>
        <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>
          Adjust platform core limits, toggles, content ingestion behaviors, and administrative configurations.
        </p>
      </div>

      <form action={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '640px' }}>
        
        {/* Registration block */}
        <div style={{ background: '#0a0a0d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio size={18} style={{ color: '#8b5cf6' }} /> Core Ingestion Parameters
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Disable Registrations toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'white' }}>Enable New Registrations</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>If disabled, new users cannot create accounts on Indico Social.</div>
              </div>
              <input 
                type="checkbox" 
                name="registrations" 
                defaultChecked 
                style={{ width: '40px', height: '20px', cursor: 'pointer' }}
              />
            </div>

            {/* Subscriptions toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'white' }}>Enable Creator Subscriptions</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Allows verified creators to configure paid community rules.</div>
              </div>
              <input 
                type="checkbox" 
                name="subscriptions" 
                defaultChecked 
                style={{ width: '40px', height: '20px', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>

        {/* Upload Limits block */}
        <div style={{ background: '#0a0a0d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={18} style={{ color: '#00f0ff' }} /> Media & Performance Parameters
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ fontWeight: '700', fontSize: '0.85rem', color: '#94a3b8' }}>MAX UPLOAD MEDIA LIMIT (MB)</label>
            <select 
              name="maxSize"
              defaultValue="50"
              style={{
                width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.08)', color: 'white', fontSize: '0.9rem', outline: 'none'
              }}
            >
              <option value="10" style={{ background: '#070709' }}>10 MB (Highly optimized, fast load times)</option>
              <option value="25" style={{ background: '#070709' }}>25 MB (Standard social feed targets)</option>
              <option value="50" style={{ background: '#070709' }}>50 MB (Premium high definition reels)</option>
              <option value="100" style={{ background: '#070709' }}>100 MB (Cinematic community videos)</option>
            </select>
          </div>
        </div>

        {/* Submit */}
        <button 
          type="submit"
          style={{
            padding: '14px 28px', borderRadius: '14px', background: '#8b5cf6',
            color: 'white', fontWeight: '800', fontSize: '0.9rem', cursor: 'pointer',
            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3)', alignSelf: 'flex-start'
          }}
        >
          <Save size={16} /> Save Security Parameters
        </button>

      </form>
    </div>
  );
}
