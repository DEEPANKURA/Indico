'use client';

import { useState, useEffect } from 'react';
import { X, Send, User, Loader2 } from 'lucide-react';
import { addCommentAction, getCommentsAction } from '@/app/actions/social';

interface CommentModalProps {
  postId: string;
  onClose: () => void;
}

export default function CommentModal({ postId, onClose }: CommentModalProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any>(null);

  useEffect(() => {
    const fetch = async () => {
      const res = await getCommentsAction(postId);
      if (res.success) setComments(res.comments || []);
      setLoading(false);
    };
    fetch();
  }, [postId]);

  const handleSubmit = async () => {
    if (!input.trim() || submitting) return;
    setSubmitting(true);
    const res = await addCommentAction(postId, input, replyingTo?.id);
    if (res.success) {
      setComments(prev => [...prev, res.comment]);
      setInput('');
      setReplyingTo(null);
    } else {
      alert(res.error || 'Failed to post comment');
    }
    setSubmitting(false);
  };

  const parentComments = comments.filter(c => !c.parent_id);
  const replies = comments.filter(c => c.parent_id);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
    }} onClick={onClose}>
      <div 
        style={{
          width: '100%', maxWidth: '600px', height: '85vh',
          background: 'var(--bg-primary)', borderRadius: '24px 24px 0 0',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          border: '1px solid var(--border-light)', borderBottom: 'none'
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontWeight: '800', fontSize: '1.1rem' }}>Comments</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="animate-spin mx-auto" /></div>
          ) : parentComments.length > 0 ? (
            parentComments.map((c) => (
              <div key={c.id}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ 
                    width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))'
                  }}>
                    {c.profiles?.avatar_url ? <img src={c.profiles.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>{c.profiles?.full_name?.[0] || 'U'}</div>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{c.profiles?.full_name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>@{c.profiles?.username}</span>
                    </div>
                    <p style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>{c.content}</p>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(c.created_at).toLocaleDateString()}</span>
                      <button 
                        onClick={() => setReplyingTo(c)}
                        style={{ background: 'none', border: 'none', padding: 0, color: 'var(--accent-secondary)', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                </div>

                {/* Render Replies */}
                {replies.filter(r => r.parent_id === c.id).map(reply => (
                  <div key={reply.id} style={{ display: 'flex', gap: '12px', marginLeft: '48px', marginTop: '16px' }}>
                    <div style={{ 
                      width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                      background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))'
                    }}>
                      {reply.profiles?.avatar_url ? <img src={reply.profiles.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '0.7rem' }}>{reply.profiles?.full_name?.[0] || 'U'}</div>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '700', fontSize: '0.85rem' }}>{reply.profiles?.full_name}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>@{reply.profiles?.username}</span>
                      </div>
                      <p style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>{reply.content}</p>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>{new Date(reply.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
              No comments yet. Be the first to share your thoughts!
            </div>
          )}
        </div>

        {/* Input area */}
        <div style={{ 
          padding: '12px 20px calc(20px + env(safe-area-inset-bottom, 20px)) 20px', 
          borderTop: '1px solid var(--border-light)', 
          background: 'var(--bg-glass)',
          position: 'sticky',
          bottom: 0
        }}>
          {replyingTo && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', fontSize: '0.85rem' }}>
              <span>Replying to <span style={{ fontWeight: '700' }}>@{replyingTo.profiles?.username}</span></span>
              <button onClick={() => setReplyingTo(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
            </div>
          )}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder={replyingTo ? "Add a reply..." : "Add a comment..."}
              style={{ 
                flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)', 
                borderRadius: '24px', padding: '12px 20px', color: 'var(--text-primary)', outline: 'none', 
                fontSize: '0.95rem' 
              }}
            />
            <button 
              onClick={handleSubmit}
              disabled={!input.trim() || submitting}
              style={{ 
                width: '44px', height: '44px', borderRadius: '50%', background: 'var(--accent-primary)',
                border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', opacity: !input.trim() || submitting ? 0.5 : 1
              }}
            >
              {submitting ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
