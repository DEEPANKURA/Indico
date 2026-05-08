'use client';

import { Send, Image as ImageIcon, Loader2, X, Video } from 'lucide-react';
import { useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { createPostAction } from '@/app/actions/post';

export default function CreatePost({ 
  communityId, 
  onPostCreated 
}: { 
  communityId?: string; 
  onPostCreated?: () => void;
}) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const router = useRouter();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please login to upload media');

      const newUrls: string[] = [];

      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { data, error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);

        newUrls.push(publicUrl);
      }

      setMediaUrls(prev => [...prev, ...newUrls]);
    } catch (err: any) {
      setError(err.message || 'Failed to upload media');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeMedia = (index: number) => {
    setMediaUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    if (!content.trim() && mediaUrls.length === 0) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createPostAction(content, mediaUrls, communityId);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      setContent('');
      setMediaUrls([]);
      
      if (onPostCreated) {
        onPostCreated();
      } else {
        router.refresh();
      }
      
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

      {mediaUrls.length > 0 && (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {mediaUrls.map((url, i) => (
            <div key={i} style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
              {url.toLowerCase().match(/\.(mp4|webm|ogg)/) || url.includes('video') ? (
                <video src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
              ) : (
                <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Preview" />
              )}
              <button 
                onClick={() => removeMedia(i)}
                style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: '20px', height: '20px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <p style={{ color: '#fca5a5', fontSize: '14px', marginBottom: '12px' }}>{error}</p>}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            multiple 
            accept="image/*,video/*" 
            style={{ display: 'none' }} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isSubmitting}
            style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center', opacity: (isUploading || isSubmitting) ? 0.5 : 1 }}
          >
            {isUploading ? <Loader2 size={20} className="animate-spin" /> : <ImageIcon size={20} />}
            <span>{isUploading ? 'Uploading...' : 'Add Media'}</span>
          </button>
        </div>
        <button
          onClick={handlePost}
          disabled={isSubmitting || isUploading || (!content.trim() && mediaUrls.length === 0)}
          className="btn-primary"
          style={{ display: 'flex', gap: '8px', alignItems: 'center', opacity: (!content.trim() && mediaUrls.length === 0 || isSubmitting || isUploading) ? 0.6 : 1 }}
        >
          {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          <span>{isSubmitting ? 'Posting...' : 'Post'}</span>
        </button>
      </div>
    </div>
  );
}
