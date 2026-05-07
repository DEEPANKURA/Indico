'use client';

import { Send, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { createPostAction } from '@/app/actions/post';

export default function CreatePost() {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handlePost = async () => {
    if (!content.trim()) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createPostAction(content);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      setContent('');
      router.refresh();
      
      if (result.isFlagged) {
        alert('Your post was created but flagged for review by our AI safety system.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '16px', marginBottom: '24px', borderRadius: '16px' }}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind? Our AI ensures a safe space for everyone."
        style={{
          width: '100%',
          background: 'rgba(0,0,0,0.2)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '12px',
          color: 'white',
          resize: 'none',
          minHeight: '100px',
          marginBottom: '12px',
          outline: 'none',
          fontFamily: 'inherit'
        }}
      />
      {error && <p style={{ color: '#fca5a5', fontSize: '14px', marginBottom: '12px' }}>{error}</p>}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <ImageIcon size={20} />
          <span>Add Media</span>
        </button>
        <button
          onClick={handlePost}
          disabled={isSubmitting || !content.trim()}
          className="btn-primary"
          style={{ display: 'flex', gap: '8px', alignItems: 'center', opacity: (!content.trim() || isSubmitting) ? 0.6 : 1 }}
        >
          {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          <span>{isSubmitting ? 'Posting...' : 'Post'}</span>
        </button>
      </div>
    </div>
  );
}
