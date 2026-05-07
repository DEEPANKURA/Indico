import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { DollarSign, CreditCard, ArrowUpRight, Gift, Users } from 'lucide-react';

export default async function MonetizePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  const { data: earnings } = await supabase
    .from('transactions')
    .select('amount, created_at, sender_id')
    .eq('receiver_id', user.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false });

  const { data: profile } = await supabase.from('profiles').select('is_creator, followers_count').eq('id', user.id).single();
  const totalEarnings = earnings?.reduce((s, e) => s + (e.amount || 0), 0) || 0;
  const thisMonth = earnings?.filter(e => new Date(e.created_at).getMonth() === new Date().getMonth()).reduce((s, e) => s + (e.amount || 0), 0) || 0;

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingTop: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <DollarSign size={28} style={{ color: '#10b981' }} />
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Monetize</h1>
        {profile?.is_creator && <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: '0.75rem', fontWeight: '700', padding: '3px 10px', borderRadius: '20px' }}>✓ Creator</span>}
      </div>

      {/* Earnings Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px' }}>
        <div style={{ background: 'linear-gradient(135deg, #1a1040, #0d2040)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '16px', padding: '20px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px' }}>Total Earnings</div>
          <div style={{ fontSize: '2rem', fontWeight: '800' }} className="text-gradient">${totalEarnings.toFixed(2)}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>All time</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #0d2040, #0d1a30)', border: '1px solid rgba(6,182,212,0.3)', borderRadius: '16px', padding: '20px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px' }}>This Month</div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#06b6d4' }}>${thisMonth.toFixed(2)}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', color: '#10b981', fontSize: '0.8rem' }}>
            <ArrowUpRight size={14} /> Growing
          </div>
        </div>
      </div>

      {/* Monetization Features */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
        {[
          { icon: Gift, title: 'Creator Tips', desc: 'Fans can send you tips from $1–$100 per post', status: 'Active', color: '#10b981' },
          { icon: Users, title: 'Exclusive Communities', desc: 'Create paid subscriber communities', status: 'Coming Soon', color: '#8b5cf6' },
          { icon: CreditCard, title: 'Merch Store', desc: 'Sell products directly to your audience', status: 'Coming Soon', color: '#06b6d4' },
        ].map((feat, i) => (
          <div key={i} className="glass-card" style={{ padding: '20px', borderRadius: '14px', display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${feat.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <feat.icon size={24} style={{ color: feat.color }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '700', marginBottom: '2px' }}>{feat.title}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{feat.desc}</div>
            </div>
            <span style={{ background: feat.status === 'Active' ? 'rgba(16,185,129,0.15)' : 'var(--bg-glass)', color: feat.status === 'Active' ? '#10b981' : 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '600', padding: '4px 10px', borderRadius: '20px', whiteSpace: 'nowrap' }}>
              {feat.status}
            </span>
          </div>
        ))}
      </div>

      {/* Payout Section */}
      <div className="glass-card" style={{ padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
        <h2 style={{ fontWeight: '700', marginBottom: '16px', fontSize: '1rem' }}>Payout Settings</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ fontWeight: '600' }}>Minimum Payout</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>$10.00 minimum threshold</div>
          </div>
          <div style={{ fontWeight: '700', fontSize: '1.1rem', color: totalEarnings >= 10 ? '#10b981' : 'var(--text-secondary)' }}>
            ${totalEarnings.toFixed(2)} / $10.00
          </div>
        </div>
        <div style={{ background: 'var(--bg-glass)', borderRadius: '8px', height: '8px', overflow: 'hidden' }}>
          <div style={{ width: `${Math.min((totalEarnings / 10) * 100, 100)}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))', transition: 'width 0.5s' }} />
        </div>
        <button className="btn-primary" style={{ width: '100%', marginTop: '16px', padding: '12px', opacity: totalEarnings >= 10 ? 1 : 0.5 }}>
          Request Payout
        </button>
      </div>

      {/* Recent Transactions */}
      <div>
        <h2 style={{ fontWeight: '700', marginBottom: '16px', fontSize: '1rem' }}>Recent Tips</h2>
        {earnings && earnings.length > 0 ? (
          earnings.slice(0, 10).map((t, i) => (
            <div key={i} className="glass-card" style={{ padding: '14px', borderRadius: '12px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>💰</div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>Tip Received</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(t.created_at).toLocaleDateString()}</div>
                </div>
              </div>
              <span style={{ color: '#10b981', fontWeight: '700' }}>+${t.amount?.toFixed(2)}</span>
            </div>
          ))
        ) : (
          <div className="glass-card" style={{ padding: '32px', textAlign: 'center', borderRadius: '16px', color: 'var(--text-secondary)' }}>
            No tips yet. Create great content and tips will follow! 💪
          </div>
        )}
      </div>
    </div>
  );
}
