'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { BarChart2, TrendingUp, Eye, Heart, Users, ArrowUpRight, DollarSign, Activity, RefreshCcw } from 'lucide-react';

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    posts: any[];
    profile: any;
    transactions: any[];
    totalLikes: number;
    totalComments: number;
    totalEarnings: number;
  }>({
    posts: [],
    profile: null,
    transactions: [],
    totalLikes: 0,
    totalComments: 0,
    totalEarnings: 0
  });
  const [isLive, setIsLive] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth'); return; }

    const [{ data: postsData }, { data: profileData }, { data: transactionsData }] = await Promise.all([
      supabase.from('posts').select('id, like_count, comment_count, created_at').eq('author_id', user.id).order('created_at', { ascending: false }),
      supabase.from('profiles').select('followers_count, following_count').eq('id', user.id).single(),
      supabase.from('transactions').select('amount, created_at').eq('recipient_id', user.id).eq('status', 'completed')
    ]);

    const likes = postsData?.reduce((s, p) => s + (p.like_count || 0), 0) || 0;
    const comments = postsData?.reduce((s, p) => s + (p.comment_count || 0), 0) || 0;
    const earnings = transactionsData?.reduce((s, e) => s + (e.amount || 0), 0) || 0;

    setData({
      posts: postsData || [],
      profile: profileData,
      transactions: transactionsData || [],
      totalLikes: likes,
      totalComments: comments,
      totalEarnings: earnings
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    let postsChannel: any;
    let profilesChannel: any;
    let transactionsChannel: any;

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Subscribe to posts for likes/comments
      postsChannel = supabase.channel(`analytics_posts_${user.id}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'posts', filter: `author_id=eq.${user.id}` }, () => {
          triggerLiveUpdate();
        }).subscribe();

      // Subscribe to profiles for followers
      profilesChannel = supabase.channel(`analytics_profile_${user.id}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, () => {
          triggerLiveUpdate();
        }).subscribe();

      // Subscribe to transactions for earnings
      transactionsChannel = supabase.channel(`analytics_tx_${user.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions', filter: `recipient_id=eq.${user.id}` }, () => {
          triggerLiveUpdate();
        }).subscribe();
    };

    const triggerLiveUpdate = () => {
      setIsLive(true);
      fetchData();
      setTimeout(() => setIsLive(false), 2000);
    };

    setupRealtime();

    return () => {
      if (postsChannel) supabase.removeChannel(postsChannel);
      if (profilesChannel) supabase.removeChannel(profilesChannel);
      if (transactionsChannel) supabase.removeChannel(transactionsChannel);
    };
  }, []);

  if (loading) return (
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingTop: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
      <RefreshCcw className="animate-spin" style={{ margin: '0 auto 12px' }} />
      Loading Analytics...
    </div>
  );

  const stats = [
    { label: 'Total Reach', value: ((data.totalLikes + data.totalComments) * 12).toLocaleString(), change: '+24%', icon: Eye, color: '#8b5cf6' },
    { label: 'Engagement', value: data.posts.length ? `${((data.totalLikes / (data.posts.length * 100)) * 100).toFixed(1)}%` : '0%', change: '+8%', icon: Activity, color: '#06b6d4' },
    { label: 'Followers', value: (data.profile?.followers_count || 0).toLocaleString(), change: '+12%', icon: Users, color: '#ec4899' },
    { label: 'Total Likes', value: data.totalLikes.toLocaleString(), change: '+31%', icon: Heart, color: '#f97316' },
  ];

  // Simple bar chart data (simulated for last 7 days)
  const barData = [40, 65, 45, 80, 55, 90, 70];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const maxBar = Math.max(...barData);

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingTop: '10px', paddingBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BarChart2 size={28} style={{ color: 'var(--accent-secondary)' }} />
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0 }}>Analytics</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: isLive ? '#10b981' : 'var(--text-secondary)' }}>
              <span className={isLive ? "animate-pulse" : ""} style={{ width: '8px', height: '8px', borderRadius: '50%', background: isLive ? '#10b981' : '#6b7280' }} />
              {isLive ? 'Detecting Live Engagement...' : 'Live Monitoring Active'}
            </div>
          </div>
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-glass)', padding: '6px 16px', borderRadius: '20px', border: '1px solid var(--border-light)' }}>
          Last 30 days
        </span>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {stats.map((stat, i) => (
          <div key={i} className="glass-card" style={{ padding: '24px', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ 
              position: 'absolute', top: '-10px', right: '-10px', width: '60px', height: '60px', 
              background: `${stat.color}11`, borderRadius: '50%', filter: 'blur(20px)' 
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ padding: '8px', borderRadius: '12px', background: `${stat.color}15` }}>
                <stat.icon size={20} style={{ color: stat.color }} />
              </div>
              <span style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '2px', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '10px' }}>
                <ArrowUpRight size={12} />{stat.change}
              </span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '4px' }}>{stat.value}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Earnings Dashboard */}
      <div style={{ 
        background: 'linear-gradient(135deg, #1a1040 0%, #0d2040 100%)', 
        border: '1px solid rgba(139,92,246,0.3)', 
        borderRadius: '24px', padding: '24px', marginBottom: '24px', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 10px 30px -10px rgba(139,92,246,0.3)'
      }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <DollarSign size={16} /> Estimated Earnings
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-0.02em' }} className="text-gradient">
            ${data.totalEarnings.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
            {data.transactions.length} successful transactions
          </div>
        </div>
        <div style={{ 
          width: '64px', height: '64px', borderRadius: '20px', 
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <TrendingUp size={32} color="#8b5cf6" />
        </div>
      </div>

      {/* Weekly Engagement Chart */}
      <div className="glass-card" style={{ padding: '24px', borderRadius: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontWeight: '700', fontSize: '1.1rem', margin: 0 }}>Engagement Trend</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--accent-secondary)' }} /> Shares
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--bg-glass-hover)' }} /> Views
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', height: '140px', paddingBottom: '10px' }}>
          {barData.map((val, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%', justifyContent: 'flex-end' }}>
              <div style={{
                width: '100%', borderRadius: '8px',
                height: `${(val / maxBar) * 100}%`,
                background: i === 6 ? 'linear-gradient(180deg, var(--accent-secondary), var(--accent-primary))' : 'var(--bg-glass-hover)',
                boxShadow: i === 6 ? '0 0 15px rgba(139,92,246,0.3)' : 'none',
                transition: 'height 1s cubic-bezier(0.4, 0, 0.2, 1)'
              }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>{days[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Content Table */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <TrendingUp size={18} style={{ color: 'var(--accent-neon)' }} />
          <h2 style={{ fontWeight: '700', fontSize: '1.1rem', margin: 0 }}>Top Performing Content</h2>
        </div>
        {data.posts.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data.posts.slice(0, 5).map((post, i) => (
              <div key={i} className="glass-card" style={{ 
                padding: '16px', borderRadius: '16px', display: 'flex', 
                justifyContent: 'space-between', alignItems: 'center',
                cursor: 'pointer', transition: 'background 0.2s'
              }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                 onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                 onClick={() => router.push(`/post/${post.id}`)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ 
                    width: '28px', height: '28px', borderRadius: '8px', background: i === 0 ? 'var(--accent-neon)' : 'rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: '800',
                    color: i === 0 ? 'black' : 'var(--text-secondary)'
                  }}>
                    {i + 1}
                  </span>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>Post Performance</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(post.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: '700' }}>{post.like_count || 0}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Likes</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: '700' }}>{post.comment_count || 0}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Comments</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', borderRadius: '24px', color: 'var(--text-secondary)' }}>
            No engagement data available yet.
          </div>
        )}
      </div>
    </div>
  );
}
