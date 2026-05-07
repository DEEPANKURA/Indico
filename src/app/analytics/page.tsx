import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { BarChart2, TrendingUp, Eye, Heart, Users, ArrowUpRight } from 'lucide-react';

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  const { data: posts } = await supabase
    .from('posts')
    .select('like_count, comment_count, created_at')
    .eq('author_id', user.id)
    .order('created_at', { ascending: false });

  const { data: profile } = await supabase.from('profiles').select('followers_count, following_count').eq('id', user.id).single();
  const { data: earnings } = await supabase.from('transactions').select('amount, created_at').eq('recipient_id', user.id).eq('status', 'completed');

  const totalLikes = posts?.reduce((s, p) => s + (p.like_count || 0), 0) || 0;
  const totalComments = posts?.reduce((s, p) => s + (p.comment_count || 0), 0) || 0;
  const totalEarnings = earnings?.reduce((s, e) => s + (e.amount || 0), 0) || 0;

  const stats = [
    { label: 'Total Reach', value: ((totalLikes + totalComments) * 12).toLocaleString(), change: '+24%', icon: Eye, color: '#8b5cf6' },
    { label: 'Engagement Rate', value: posts?.length ? `${((totalLikes / (posts.length * 100)) * 100).toFixed(1)}%` : '0%', change: '+8%', icon: TrendingUp, color: '#06b6d4' },
    { label: 'Followers', value: (profile?.followers_count || 0).toLocaleString(), change: '+12%', icon: Users, color: '#ec4899' },
    { label: 'Total Likes', value: totalLikes.toLocaleString(), change: '+31%', icon: Heart, color: '#f97316' },
  ];

  // Simple bar chart data (last 7 days simulated)
  const barData = [40, 65, 45, 80, 55, 90, 70];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const maxBar = Math.max(...barData);

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingTop: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <BarChart2 size={28} style={{ color: 'var(--accent-secondary)' }} />
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Analytics</h1>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-glass)', padding: '3px 10px', borderRadius: '20px' }}>Last 30 days</span>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {stats.map((stat, i) => (
          <div key={i} className="glass-card" style={{ padding: '20px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <stat.icon size={22} style={{ color: stat.color }} />
              <span style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '2px' }}>
                <ArrowUpRight size={14} />{stat.change}
              </span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '4px' }}>{stat.value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Earnings */}
      <div style={{ background: 'linear-gradient(135deg, #1a1040, #0d2040)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '16px', padding: '20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>Total Earnings</div>
          <div style={{ fontSize: '2.2rem', fontWeight: '800' }} className="text-gradient">${totalEarnings.toFixed(2)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>Tips Received</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{earnings?.length || 0}</div>
        </div>
      </div>

      {/* Weekly Engagement Chart */}
      <div className="glass-card" style={{ padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
        <h2 style={{ fontWeight: '700', marginBottom: '20px', fontSize: '1rem' }}>Weekly Engagement</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '120px' }}>
          {barData.map((val, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
              <div style={{
                width: '100%', borderRadius: '6px 6px 0 0',
                height: `${(val / maxBar) * 100}%`,
                background: i === 6 ? 'linear-gradient(180deg, var(--accent-secondary), var(--accent-primary))' : 'var(--bg-glass-hover)',
                transition: 'height 0.5s ease'
              }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{days[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Posts */}
      <div>
        <h2 style={{ fontWeight: '700', marginBottom: '16px', fontSize: '1rem' }}>Top Performing Posts</h2>
        {posts && posts.length > 0 ? (
          posts.slice(0, 5).map((post, i) => (
            <div key={i} className="glass-card" style={{ padding: '14px', borderRadius: '12px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: '700', marginRight: '12px' }}>#{i + 1}</span>
              <span style={{ flex: 1, fontSize: '0.9rem' }}>{new Date(post.created_at).toLocaleDateString()}</span>
              <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <span>❤️ {post.like_count || 0}</span>
                <span>💬 {post.comment_count || 0}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="glass-card" style={{ padding: '32px', textAlign: 'center', borderRadius: '16px', color: 'var(--text-secondary)' }}>
            Create posts to see analytics data here.
          </div>
        )}
      </div>
    </div>
  );
}
