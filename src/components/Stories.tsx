'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string;
  };
}

export default function Stories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);
  const supabase = createClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchData() {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      // 1. Get followings
      const { data: followings } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentUser.id);
      
      const followingIds = followings?.map(f => f.following_id) || [];
      const filterIds = [currentUser.id, ...followingIds];

      // 2. Fetch active stories from followings
      const { data } = await (supabase
        .from('stories' as any)
        .select('*, profiles:user_id(username, avatar_url)')
        .in('user_id', filterIds)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false }) as any);

      if (data) {
        setStories(data);
      }
      setLoading(false);
    }
    fetchData();
  }, [supabase]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setLoading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;
      const filePath = `stories/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      const { data, error: insertError } = await (supabase
        .from('stories' as any)
        .insert({
          user_id: user.id,
          media_url: publicUrl,
          media_type: file.type.startsWith('video') ? 'video' : 'image'
        })
        .select('*, profiles:user_id(username, avatar_url)')
        .single() as any);

      if (insertError) throw insertError;

      if (data) {
        setStories([data, ...stories]);
      }
    } catch (error: any) {
      alert(error.message || 'Failed to upload story');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStory = () => {
    if (!user) return alert('Please login to add a story');
    fileInputRef.current?.click();
  };

  const nextStory = () => {
    if (activeStoryIndex !== null && activeStoryIndex < stories.length - 1) {
      setActiveStoryIndex(activeStoryIndex + 1);
    } else {
      setActiveStoryIndex(null);
    }
  };

  const prevStory = () => {
    if (activeStoryIndex !== null && activeStoryIndex > 0) {
      setActiveStoryIndex(activeStoryIndex - 1);
    }
  };

  if (loading) return null;

  return (
    <div style={{ marginBottom: '32px', position: 'relative' }}>
      <input 
        type="file" 
        ref={fileInputRef} 
        hidden 
        accept="image/*,video/*"
        onChange={handleFileChange}
      />
      <div 
        ref={scrollRef}
        style={{ 
          display: 'flex', gap: '16px', overflowX: 'auto', padding: '4px',
          scrollbarWidth: 'none', msOverflowStyle: 'none'
        }}
        className="no-scrollbar"
      >
        {/* Add Story Button */}
        <div style={{ flexShrink: 0, textAlign: 'center', cursor: 'pointer' }} onClick={handleAddStory}>
          <div style={{ 
            width: '68px', height: '68px', borderRadius: '50%', 
            background: 'var(--card-bg)', border: '2px dashed var(--accent-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '8px', position: 'relative'
          }} className="hover-scale">
            <Plus size={24} style={{ color: 'var(--accent-primary)' }} />
            <div style={{ 
              position: 'absolute', bottom: '0', right: '0', 
              background: 'var(--accent-primary)', borderRadius: '50%', padding: '2px',
              border: '2px solid var(--bg-primary)'
            }}>
              <Plus size={12} color="white" />
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Your Story</span>
        </div>

        {/* Story List */}
        {stories.map((story, index) => (
          <div 
            key={story.id} 
            style={{ flexShrink: 0, textAlign: 'center', cursor: 'pointer' }}
            onClick={() => setActiveStoryIndex(index)}
          >
            <div style={{ 
              width: '68px', height: '68px', borderRadius: '50%', 
              background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
              padding: '3px', marginBottom: '8px'
            }} className="hover-scale">
              <div style={{ 
                width: '100%', height: '100%', borderRadius: '50%', 
                border: '3px solid var(--bg-primary)', overflow: 'hidden', position: 'relative'
              }}>
                <Image 
                  src={story.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${story.profiles?.username}`}
                  alt={story.profiles?.username}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </div>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-primary)', maxWidth: '68px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {story.profiles?.username}
            </span>
          </div>
        ))}
      </div>

      {/* Story Viewer Modal */}
      {activeStoryIndex !== null && (
        <div style={{ 
          position: 'fixed', inset: 0, zIndex: 5000, 
          background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <button 
            onClick={() => setActiveStoryIndex(null)}
            style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
          >
            <X size={32} />
          </button>

          <div style={{ width: '100%', maxWidth: '450px', height: '85vh', position: 'relative', borderRadius: '20px', overflow: 'hidden', background: '#111' }}>
            {/* Progress Bars */}
            <div style={{ position: 'absolute', top: '16px', left: '16px', right: '16px', display: 'flex', gap: '4px', zIndex: 10 }}>
              {stories.map((_, i) => (
                <div key={i} style={{ flex: 1, height: '2px', background: i <= activeStoryIndex ? 'white' : 'rgba(255,255,255,0.3)', borderRadius: '2px' }} />
              ))}
            </div>

            {/* User Info Overlay */}
            <div style={{ position: 'absolute', top: '32px', left: '16px', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 10 }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', border: '2px solid white', position: 'relative' }}>
                <Image 
                  src={stories[activeStoryIndex].profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${stories[activeStoryIndex].profiles?.username}`}
                  alt="avatar"
                  fill
                />
              </div>
              <div>
                <div style={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>{stories[activeStoryIndex].profiles?.username}</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>{new Date(stories[activeStoryIndex].created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>

            {/* Media Content */}
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
               <Image 
                  src={stories[activeStoryIndex].media_url}
                  alt="story"
                  fill
                  style={{ objectFit: 'contain' }}
               />
               
               {/* Tap Regions */}
               <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
                 <div style={{ flex: 1, cursor: 'pointer' }} onClick={prevStory} />
                 <div style={{ flex: 2, cursor: 'pointer' }} onClick={nextStory} />
               </div>
            </div>

            {/* Navigation Arrows (Desktop) */}
            <div style={{ position: 'absolute', top: '50%', left: '-80px', transform: 'translateY(-50%)' }}>
              <button 
                onClick={prevStory} 
                disabled={activeStoryIndex === 0}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '12px', borderRadius: '50%', cursor: 'pointer', opacity: activeStoryIndex === 0 ? 0.3 : 1 }}
              >
                <ChevronLeft size={32} />
              </button>
            </div>
            <div style={{ position: 'absolute', top: '50%', right: '-80px', transform: 'translateY(-50%)' }}>
              <button 
                onClick={nextStory}
                disabled={activeStoryIndex === stories.length - 1}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '12px', borderRadius: '50%', cursor: 'pointer', opacity: activeStoryIndex === stories.length - 1 ? 0.3 : 1 }}
              >
                <ChevronRight size={32} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
