import { createClient } from '@/utils/supabase/server';
import { adminDeletePostAction } from '@/app/actions/admin';
import { Trash2, ShieldAlert, Award, Film, Eye } from 'lucide-react';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export default async function AdminPostsPage() {
  const supabase = await createClient();

  // Query live posts with author profiles join
  const { data: rawPosts } = await supabase
    .from('posts')
    .select('*, author:profiles(username, avatar_url)')
    .order('created_at', { ascending: false })
    .limit(20);

  const posts = (rawPosts || []) as any[];

  const handleDelete = async (formData: FormData) => {
    'use server';
    const postId = formData.get('postId') as string;
    await adminDeletePostAction(postId);
    revalidatePath('/admin/posts');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'white', margin: '0 0 6px 0', letterSpacing: '-0.025em' }}>
          Posts & Content Feed
        </h1>
        <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>
          Preview uploads, inspect AI safety metrics, and wipe out content that violates policy guidelines.
        </p>
      </div>

      {/* Grid of Posts */}
      {posts.length === 0 ? (
        <div style={{ padding: '64px', textAlign: 'center', background: '#0a0a0d', borderRadius: '24px', color: '#64748b' }}>
          No posts uploaded on the platform yet.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {posts.map((post) => {
            const mediaUrl = post.media_urls?.[0];
            const isVideo = mediaUrl?.toLowerCase()?.endsWith('.mp4');
            const hasMedia = !!mediaUrl;

            return (
              <div 
                key={post.id} 
                style={{
                  background: '#0a0a0d', border: '1px solid rgba(255,255,255,0.06)', 
                  borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column'
                }}
              >
                {/* Media Preview Box */}
                <div style={{
                  height: '200px', background: '#121216', position: 'relative',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                  borderBottom: '1px solid rgba(255,255,255,0.04)'
                }}>
                  {hasMedia ? (
                    isVideo ? (
                      <video src={mediaUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                    ) : (
                      <img src={mediaUrl} alt="Post content" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )
                  ) : (
                    <div style={{ color: '#475569', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <Film size={32} />
                      <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>TEXT POST ONLY</span>
                    </div>
                  )}

                  {/* Safety Indicator Overlay */}
                  <div style={{
                    position: 'absolute', top: '12px', right: '12px',
                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
                    padding: '6px 12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '800'
                  }}>
                    <ShieldAlert size={14} style={{ color: post.ai_safety_score < 70 ? '#ef4444' : '#10b981' }} />
                    <span style={{ color: post.ai_safety_score < 70 ? '#ef4444' : '#10b981' }}>
                      AI: {post.ai_safety_score ?? 100}% SAFE
                    </span>
                  </div>
                </div>

                {/* Content Block */}
                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%', background: '#8b5cf6',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.75rem'
                    }}>
                      {post.author?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>@{post.author?.username || 'unknown'}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                        {new Date(post.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {post.content && (
                    <p style={{
                      margin: 0, fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.5',
                      overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
                      WebkitLineClamp: 3, WebkitBoxOrient: 'vertical'
                    }}>
                      {post.content}
                    </p>
                  )}

                  {/* Actions Grid */}
                  <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <a 
                      href={`/posts/${post.id}`} 
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1, padding: '8px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)',
                        background: 'rgba(255,255,255,0.02)', color: 'white', fontSize: '0.8rem', fontWeight: '700',
                        textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                      }}
                    >
                      <Eye size={14} /> View
                    </a>
                    
                    <form action={handleDelete} style={{ flex: 1 }}>
                      <input type="hidden" name="postId" value={post.id} />
                      <button 
                        type="submit" 
                        style={{
                          width: '100%', padding: '8px', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.2)',
                          background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '0.8rem', fontWeight: '700',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                        }}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
