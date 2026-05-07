import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { Video, Eye, Heart, MessageCircle, TrendingUp, BarChart2, Plus } from 'lucide-react';
import Link from 'next/link';

export default async function StudioPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  const { data: posts } = await supabase
    .from('posts')
    .select('id, content, like_count, comment_count, created_at, ai_safety_score, is_flagged')
    .eq('author_id', user.id)
    .order('created_at', { ascending: false });

  const totalLikes = posts?.reduce((s, p) => s + (p.like_count || 0), 0) || 0;
  const totalComments = posts?.reduce((s, p) => s + (p.comment_count || 0), 0) || 0;

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingTop: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Video size={28} style={{ color: 'var(--accent-secondary)' }} />
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Creator Studio</h1>
        </div>
        <Link href="/upload" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', padding: '10px 18px' }}>
          <Plus size={18} /> New Post
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Total Posts', value: posts?.length || 0, icon: BarChart2, color: '#8b5cf6' },
          { label: 'Total Likes', value: totalLikes, icon: Heart, color: '#ec4899' },
          { label: 'Total Comments', value: totalComments, icon: MessageCircle, color: '#06b6d4' },
        ].map((stat, i) => (
          <div key={i} className="glass-card" style={{ padding: '16px', borderRadius: '14px', textAlign: 'center' }}>
            <stat.icon size={24} style={{ color: stat.color, marginBottom: '8px' }} />
            <div style={{ fontSize: '1.6rem', fontWeight: '800' }}>{stat.value.toLocaleString()}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Posts List */}
      <h2 style={{ fontWeight: '700', marginBottom: '16px', fontSize: '1.1rem' }}>Your Content</h2>
      {posts && posts.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {posts.map((post) => (
            <div key={post.id} className="glass-card" style={{ padding: '16px', borderRadius: '14px', borderLeft: post.is_flagged ? '4px solid #ef4444' : '4px solid var(--accent-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <p style={{ flex: 1, lineHeight: '1.5', fontSize: '0.95rem', marginRight: '12px' }}>
                  {post.content?.slice(0, 120)}{(post.content?.length || 0) > 120 ? '...' : ''}
                </p>
                {post.is_flagged && (
                  <span style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px', whiteSpace: 'nowrap' }}>⚠ Flagged</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '10px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Heart size={14} /> {post.like_count || 0}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MessageCircle size={14} /> {post.comment_count || 0}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><TrendingUp size={14} /> AI Score: {post.ai_safety_score || 100}%</span>
                <span style={{ marginLeft: 'auto' }}>{new Date(post.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center', borderRadius: '16px' }}>
          <Video size={48} style={{ color: 'var(--text-secondary)', marginBottom: '12px' }} />
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>No content yet. Start creating!</p>
          <Link href="/upload" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none', padding: '10px 24px' }}>Upload First Post</Link>
        </div>
      )}
    </div>
  );
}
