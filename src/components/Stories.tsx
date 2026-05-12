'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, X, ChevronLeft, ChevronRight, Type, AtSign, Send, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';
import { createStoryAction } from '@/app/actions/profile';
import { User } from '@supabase/supabase-js';
import MusicSelector from './MusicSelector';
import { uploadToCloudinary } from '@/utils/cloudinary';
import { Music as MusicIcon, Volume2, VolumeX } from 'lucide-react';

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  created_at: string;
  overlay_text?: string;
  text_color?: string;
  text_x?: number;
  text_y?: number;
  mentions?: string[];
  profiles: {
    username: string;
    avatar_url: string;
  };
  music_url?: string;
  music_title?: string;
  music_artist?: string;
}

interface StoryGroup {
  user_id: string;
  username: string;
  avatar_url: string;
  stories: Story[];
}

export default function Stories() {
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [activeGroupIndex, setActiveGroupIndex] = useState<number | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  
  // Editor State
  const [editorFile, setEditorFile] = useState<File | null>(null);
  const [editorPreview, setEditorPreview] = useState<string | null>(null);
  const [overlayText, setOverlayText] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textPosition, setTextPosition] = useState({ x: 50, y: 50 });
  const [isUploading, setIsUploading] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<any>(null);
  const [showMusicSelector, setShowMusicSelector] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = createClient();
    async function fetchData() {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (!currentUser) {
        setLoading(false);
        return;
      }

      const { data: followings } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentUser.id);
      
      const followingIds = followings?.map(f => f.following_id) || [];
      const filterIds = [currentUser.id, ...followingIds];

      const { data } = await supabase
        .from('stories')
        .select('*, profiles:user_id(username, avatar_url)')
        .in('user_id', filterIds)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: true });

      if (data) {
        const groups: { [key: string]: StoryGroup } = {};
        data.forEach((story) => {
          if (!groups[story.user_id]) {
            groups[story.user_id] = {
              user_id: story.user_id,
              username: (story as any).profiles?.username || 'Unknown',
              avatar_url: (story as any).profiles?.avatar_url || '',
              stories: []
            };
          }
          groups[story.user_id].stories.push(story as any);
        });
        
        const groupList = Object.values(groups);
        const currentUserGroupIndex = groupList.findIndex(g => g.user_id === currentUser.id);
        if (currentUserGroupIndex > -1) {
          const [currentUserGroup] = groupList.splice(currentUserGroupIndex, 1);
          groupList.unshift(currentUserGroup);
        }
        
        setStoryGroups(groupList);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (editorPreview) URL.revokeObjectURL(editorPreview);
    setEditorFile(file);
    setEditorPreview(URL.createObjectURL(file));
  };

  const handleUploadStory = async () => {
    if (!editorFile || !user) return;
    setIsUploading(true);
    
    try {
      // File size limit check: allow up to 200MB media reliably
      if (editorFile.size > 200 * 1024 * 1024) {
        throw new Error('File is too large. Maximum size is 200MB.');
      }

      const publicUrl = await uploadToCloudinary(editorFile, 'stories');

      const formData = new FormData();
      formData.append('media_url', publicUrl);
      formData.append('media_type', editorFile.type.startsWith('video') ? 'video' : 'image');
      formData.append('overlay_text', overlayText);
      formData.append('text_color', textColor);
      formData.append('text_x', textPosition.x.toString());
      formData.append('text_y', textPosition.y.toString());
      if (selectedMusic) {
        formData.append('music_url', selectedMusic.audio);
        formData.append('music_title', selectedMusic.name);
        formData.append('music_artist', selectedMusic.artist_name);
      }

      const result = await createStoryAction(formData);
      
      if (result.success && result.story) {
        const newStory = result.story as Story;
        setStoryGroups(prev => {
          const next = [...prev];
          const userGroup = next.find(g => g.user_id === user.id);
          if (userGroup) {
            userGroup.stories = [...userGroup.stories, newStory];
          } else {
            next.unshift({
              user_id: user.id,
              username: user.user_metadata?.username || 'You',
              avatar_url: user.user_metadata?.avatar_url || '',
              stories: [newStory]
            });
          }
          return next;
        });
        if (editorPreview) URL.revokeObjectURL(editorPreview);
        setEditorFile(null);
        setEditorPreview(null);
        setOverlayText('');
        setSelectedMusic(null);
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      alert(error.message || 'Failed to upload story');
    } finally {
      setIsUploading(false);
    }
  };

  const nextStory = useCallback(() => {
    if (activeGroupIndex === null) return;
    
    const currentGroup = storyGroups[activeGroupIndex];
    if (activeStoryIndex < currentGroup.stories.length - 1) {
      setActiveStoryIndex(prev => prev + 1);
    } else if (activeGroupIndex < storyGroups.length - 1) {
      setActiveGroupIndex(prev => (prev !== null ? prev + 1 : null));
      setActiveStoryIndex(0);
    } else {
      setActiveGroupIndex(null);
      setActiveStoryIndex(0);
    }
  }, [activeGroupIndex, activeStoryIndex, storyGroups]);

  const prevStory = useCallback(() => {
    if (activeGroupIndex === null) return;
    
    if (activeStoryIndex > 0) {
      setActiveStoryIndex(prev => prev - 1);
    } else if (activeGroupIndex > 0) {
      const prevGroup = storyGroups[activeGroupIndex - 1];
      setActiveGroupIndex(prev => (prev !== null ? prev - 1 : null));
      setActiveStoryIndex(prevGroup.stories.length - 1);
    } else {
      setActiveStoryIndex(0);
    }
  }, [activeGroupIndex, activeStoryIndex, storyGroups]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (activeGroupIndex !== null) {
      timer = setTimeout(() => {
        nextStory();
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [activeGroupIndex, nextStory]);

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
        style={{ 
          display: 'flex', gap: '16px', overflowX: 'auto', padding: '4px',
          scrollbarWidth: 'none', msOverflowStyle: 'none'
        }}
        className="no-scrollbar"
      >
        {/* Add Story Button */}
        <div style={{ flexShrink: 0, textAlign: 'center', cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()}>
          <div style={{ 
            width: '68px', height: '68px', borderRadius: '50%', 
            background: 'var(--bg-glass)', border: '2px dashed var(--accent-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '8px', position: 'relative'
          }} className="hover-scale">
            <Plus size={24} style={{ color: 'var(--accent-primary)' }} />
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Add Story</span>
        </div>

        {/* Story Groups */}
        {storyGroups.map((group, index) => (
          <div 
            key={group.user_id} 
            style={{ flexShrink: 0, textAlign: 'center', cursor: 'pointer' }}
            onClick={() => {
              setActiveGroupIndex(index);
              setActiveStoryIndex(0);
            }}
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
                  src={group.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${group.username}`}
                  alt={group.username}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </div>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-primary)', maxWidth: '68px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {group.user_id === user?.id ? 'Your Story' : group.username}
            </span>
          </div>
        ))}
      </div>

      {/* Story Editor Modal */}
      {editorPreview && (
        <div style={{ 
          position: 'fixed', inset: 0, zIndex: 6000, 
          background: 'black', display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', display: 'flex', justifyContent: 'space-between', zIndex: 10 }}>
            <button onClick={() => { setEditorFile(null); setEditorPreview(null); }} style={{ background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', padding: '10px', borderRadius: '50%', cursor: 'pointer' }}>
              <X size={24} />
            </button>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button style={{ background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', padding: '10px', borderRadius: '50%', cursor: 'pointer' }}>
                <Type size={24} />
              </button>
              <button 
                onClick={() => setShowMusicSelector(true)}
                style={{ background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', padding: '10px', borderRadius: '50%', cursor: 'pointer' }}>
                <MusicIcon size={24} />
              </button>
            </div>
          </div>

          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: '450px', height: '85vh', position: 'relative', borderRadius: '20px', overflow: 'hidden' }}>
              <Image src={editorPreview} alt="preview" fill style={{ objectFit: 'contain' }} />
              
              {/* Overlay Text Input */}
              <textarea
                value={overlayText}
                onChange={(e) => setOverlayText(e.target.value)}
                placeholder="Type something..."
                style={{
                  position: 'absolute',
                  top: `${textPosition.y}%`,
                  left: `${textPosition.x}%`,
                  transform: 'translate(-50%, -50%)',
                  background: 'transparent',
                  border: 'none',
                  color: textColor,
                  fontSize: '1.8rem',
                  fontWeight: '800',
                  textAlign: 'center',
                  width: '90%',
                  outline: 'none',
                  resize: 'none',
                  textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                  fontFamily: 'inherit'
                }}
              />

              {selectedMusic && (
                <div style={{
                  position: 'absolute', bottom: '20px', left: '20px', right: '20px',
                  background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)',
                  padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px'
                }}>
                  <MusicIcon size={16} color="var(--accent-primary)" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: 'white', fontSize: '0.8rem', fontWeight: 'bold' }}>{selectedMusic.name}</div>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem' }}>{selectedMusic.artist_name}</div>
                  </div>
                  <button onClick={() => setSelectedMusic(null)} style={{ color: 'white' }}>
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div style={{ padding: '20px', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              onClick={handleUploadStory}
              disabled={isUploading}
              style={{ 
                background: 'white', color: 'black', padding: '12px 24px', borderRadius: '30px', 
                fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
              }}
            >
              {isUploading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
              {isUploading ? 'Sharing...' : 'Share to Story'}
            </button>
          </div>

          {showMusicSelector && (
            <MusicSelector 
              onSelect={(track) => setSelectedMusic(track)}
              onClose={() => setShowMusicSelector(false)}
            />
          )}
        </div>
      )}

      {/* Story Viewer Modal */}
      {activeGroupIndex !== null && (
        <div style={{ 
          position: 'fixed', inset: 0, zIndex: 5000, 
          background: 'rgba(0,0,0,0.98)', backdropFilter: 'blur(20px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <button 
            onClick={() => setActiveGroupIndex(null)}
            style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'white', cursor: 'pointer', zIndex: 100 }}
          >
            <X size={32} />
          </button>

          <div style={{ width: '100%', maxWidth: '450px', height: '90vh', position: 'relative', borderRadius: '20px', overflow: 'hidden', background: '#000' }}>
            {/* Progress Bars */}
            <div style={{ position: 'absolute', top: '16px', left: '16px', right: '16px', display: 'flex', gap: '4px', zIndex: 10 }}>
              {storyGroups[activeGroupIndex].stories.map((_, i) => (
                <div key={i} style={{ flex: 1, height: '2px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ 
                    height: '100%', 
                    background: 'white', 
                    width: i < activeStoryIndex ? '100%' : i === activeStoryIndex ? '100%' : '0%',
                    transition: i === activeStoryIndex ? 'width 5s linear' : 'none'
                  }} />
                </div>
              ))}
            </div>

            {/* User Info Overlay */}
            <div style={{ position: 'absolute', top: '32px', left: '16px', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 10 }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', border: '2px solid white', position: 'relative' }}>
                <Image 
                  src={storyGroups[activeGroupIndex].avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${storyGroups[activeGroupIndex].username}`}
                  alt="avatar"
                  fill
                />
              </div>
              <div>
                <div style={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>{storyGroups[activeGroupIndex].username}</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>
                  {new Date(storyGroups[activeGroupIndex].stories[activeStoryIndex].created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>

            {/* Music Info Indicator */}
            {storyGroups[activeGroupIndex].stories[activeStoryIndex].music_url && (
              <div style={{ 
                position: 'absolute', top: '80px', left: '16px', right: '16px',
                display: 'flex', alignItems: 'center', gap: '8px', zIndex: 10,
                color: 'white', background: 'rgba(0,0,0,0.3)', padding: '6px 12px',
                borderRadius: '20px', width: 'fit-content'
              }}>
                <MusicIcon size={14} className="animate-pulse" />
                <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>
                  {storyGroups[activeGroupIndex].stories[activeStoryIndex].music_title} - {storyGroups[activeGroupIndex].stories[activeStoryIndex].music_artist}
                </span>
                <audio 
                  autoPlay={isPlaying} 
                  src={storyGroups[activeGroupIndex].stories[activeStoryIndex].music_url} 
                  loop 
                />
              </div>
            )}

            {/* Media Content */}
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
               <Image 
                  src={storyGroups[activeGroupIndex].stories[activeStoryIndex].media_url}
                  alt="story"
                  fill
                  style={{ objectFit: 'contain' }}
               />
               
               {/* Text Overlay */}
               {storyGroups[activeGroupIndex].stories[activeStoryIndex].overlay_text && (
                 <div style={{
                   position: 'absolute',
                   top: `${storyGroups[activeGroupIndex].stories[activeStoryIndex].text_y}%`,
                   left: `${storyGroups[activeGroupIndex].stories[activeStoryIndex].text_x}%`,
                   transform: 'translate(-50%, -50%)',
                   color: storyGroups[activeGroupIndex].stories[activeStoryIndex].text_color || 'white',
                   fontSize: '1.8rem',
                   fontWeight: '800',
                   textAlign: 'center',
                   width: '90%',
                   textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                   pointerEvents: 'none'
                 }}>
                   {storyGroups[activeGroupIndex].stories[activeStoryIndex].overlay_text}
                 </div>
               )}
               
               {/* Tap Regions */}
               <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
                 <div style={{ flex: 1, cursor: 'pointer' }} onClick={prevStory} />
                 <div style={{ flex: 2, cursor: 'pointer' }} onClick={nextStory} />
               </div>
            </div>

            {/* Navigation Arrows (Desktop) */}
            <button 
              onClick={prevStory} 
              style={{ position: 'absolute', top: '50%', left: '-80px', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '12px', borderRadius: '50%', cursor: 'pointer' }}
              className="hide-on-mobile"
            >
              <ChevronLeft size={32} />
            </button>
            <button 
              onClick={nextStory}
              style={{ position: 'absolute', top: '50%', right: '-80px', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '12px', borderRadius: '50%', cursor: 'pointer' }}
              className="hide-on-mobile"
            >
              <ChevronRight size={32} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
