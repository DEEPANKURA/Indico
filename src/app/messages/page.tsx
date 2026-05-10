'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { MessageSquare, Send, Search, User, Loader2, ArrowLeft, Users, Plus, Smile, X, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { searchUsersAction } from '@/app/actions/social';

const STICKERS = [
  'https://fonts.gstatic.com/s/e/notoemoji/latest/1f600/512.gif',
  'https://fonts.gstatic.com/s/e/notoemoji/latest/1f60d/512.gif',
  'https://fonts.gstatic.com/s/e/notoemoji/latest/1f929/512.gif',
  'https://fonts.gstatic.com/s/e/notoemoji/latest/1f973/512.gif',
  'https://fonts.gstatic.com/s/e/notoemoji/latest/1f60e/512.gif',
  'https://fonts.gstatic.com/s/e/notoemoji/latest/1f914/512.gif',
  'https://fonts.gstatic.com/s/e/notoemoji/latest/1f631/512.gif',
  'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44b/512.gif',
  'https://fonts.gstatic.com/s/e/notoemoji/latest/1f680/512.gif',
  'https://fonts.gstatic.com/s/e/notoemoji/latest/2728/512.gif',
];

export default function MessagesPage() {
  const supabase = createClient();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [showStickers, setShowStickers] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUser(user);
      fetchConversations(user.id);
    };
    init();

    const handleManualRefresh = () => {
      console.log('Manual unread refresh triggered');
      if (currentUser) fetchConversations(currentUser.id);
    };

    window.addEventListener('messages_read', handleManualRefresh);

    return () => {
      window.removeEventListener('messages_read', handleManualRefresh);
    };
  }, [currentUser]);

  useEffect(() => {
    if ((selectedUser || selectedGroup) && currentUser) {
      if (selectedUser) fetchMessages(selectedUser.id);
      else if (selectedGroup) fetchGroupMessages(selectedGroup.id);
      
      // Subscribe to new messages
      const channel = supabase
        .channel('realtime_messages')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages'
        }, (payload) => {
          const newMsg = payload.new;
          
          // Handle DM
          if (selectedUser && 
             ((newMsg.sender_id === selectedUser.id && newMsg.recipient_id === currentUser.id) ||
              (newMsg.sender_id === currentUser.id && newMsg.recipient_id === selectedUser.id))) {
            setMessages(prev => [...prev, newMsg]);
            if (newMsg.sender_id === selectedUser.id) markAsRead(newMsg.id);
          } 
          // Handle Group
          else if (selectedGroup && newMsg.group_id === selectedGroup.id) {
            // We need the sender profile for group messages
            fetchSenderProfile(newMsg).then(msgWithSender => {
              setMessages(prev => [...prev, msgWithSender]);
            });
          }
          
          // Refresh conversations list
          fetchConversations(currentUser.id);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedUser, selectedGroup, currentUser]);

  const fetchSenderProfile = async (msg: any) => {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .eq('id', msg.sender_id)
      .single();
    return { ...msg, sender: data };
  };

  const markAsRead = async (msgId: string) => {
    await supabase.from('messages').update({ is_read: true }).eq('id', msgId);
    window.dispatchEvent(new Event('messages_read'));
  };

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const fetchConversations = async (userId: string) => {
    // Fetch DMs
    const { data: dmData } = await supabase
      .from('messages')
      .select(`
        sender_id,
        recipient_id,
        content,
        message_type,
        created_at,
        sender:profiles!sender_id(id, username, full_name, avatar_url),
        recipient:profiles!recipient_id(id, username, full_name, avatar_url)
      `)
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .is('group_id', null)
      .order('created_at', { ascending: false });

    // Fetch Groups
    const { data: groupMemberships } = await (supabase as any)
      .from('group_members')
      .select('group_id, group:groups(*)')
      .eq('user_id', userId);

    const convs: any[] = [];
    const seen = new Set();

    if (dmData) {
      (dmData as any[]).forEach(msg => {
        const otherUser = msg.sender_id === userId ? msg.recipient : msg.sender;
        if (otherUser && !seen.has(otherUser.id)) {
          convs.push({
            type: 'dm',
            user: otherUser,
            lastMsg: msg.message_type === 'sticker' ? 'Sent a sticker' : msg.content,
            time: msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            timestamp: new Date(msg.created_at).getTime()
          });
          seen.add(otherUser.id);
        }
      });
    }

    if (groupMemberships) {
      for (const membership of groupMemberships) {
        const group = (membership as any).group;
        if (!group) continue;
        
        // Fetch last message for group
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('content, created_at, message_type')
          .eq('group_id', group.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        convs.push({
          type: 'group',
          group: group,
          lastMsg: lastMsg ? ((lastMsg as any).message_type === 'sticker' ? 'Sent a sticker' : (lastMsg as any).content) : 'No messages yet',
          time: lastMsg ? new Date((lastMsg as any).created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          timestamp: lastMsg ? new Date((lastMsg as any).created_at).getTime() : 0
        });
      }
    }

    setConversations(convs.sort((a, b) => b.timestamp - a.timestamp));
    setLoading(false);
  };

  const fetchGroupMessages = async (groupId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*, sender:profiles!sender_id(id, username, full_name, avatar_url)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });

    if (data) setMessages(data);
  };

  const fetchMessages = async (otherUserId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*, posts:post_id(id, content, media_urls)')
      .or(`and(sender_id.eq.${currentUser.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${currentUser.id})`)
      .order('created_at', { ascending: true });

    if (data) setMessages(data);

    // Mark as read
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('recipient_id', currentUser.id)
        .eq('sender_id', otherUserId)
        .eq('is_read', false); // Only update unread ones to trigger less events
      
      if (!error) {
        window.dispatchEvent(new Event('messages_read'));
      }
    } catch (e) {
      console.error('Error marking messages as read:', e);
    }
  };

  const handleSend = async (stickerUrl?: string) => {
    if ((!input.trim() && !stickerUrl) || (!selectedUser && !selectedGroup) || !currentUser) return;

    const newMsg: any = {
      sender_id: currentUser.id,
      content: stickerUrl ? '' : input,
      message_type: stickerUrl ? 'sticker' : 'text',
      sticker_url: stickerUrl || null
    };

    if (selectedUser) {
      newMsg.recipient_id = selectedUser.id;
    } else {
      newMsg.group_id = selectedGroup.id;
    }

    // Optimistic update (simple)
    const optimisticMsg = { 
      ...newMsg, 
      created_at: new Date().toISOString(),
      sender: {
        id: currentUser.id,
        full_name: currentUser.user_metadata?.full_name || 'Me',
        avatar_url: currentUser.user_metadata?.avatar_url
      }
    };
    setMessages(prev => [...prev, optimisticMsg]);
    if (!stickerUrl) setInput('');
    setShowStickers(false);

    const { error } = await supabase.from('messages').insert(newMsg);
    if (error) {
      alert('Failed to send message');
      setMessages(prev => prev.filter(m => m !== optimisticMsg));
    } else {
      fetchConversations(currentUser.id);
    }
  };

  const createGroup = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) {
      alert('Please enter a group name and select at least one member');
      return;
    }

    const { data: group, error } = await supabase
      .from('groups')
      .insert({
        name: groupName,
        creator_id: currentUser.id
      })
      .select()
      .single();

    if (error) {
      alert('Failed to create group');
      return;
    }

    // Add selected members
    const members = selectedMembers.map(m => ({
      group_id: group.id,
      user_id: m.id,
      role: 'member'
    }));

    await supabase.from('group_members').insert(members);

    setIsCreatingGroup(false);
    setGroupName('');
    setSelectedMembers([]);
    fetchConversations(currentUser.id);
    setSelectedGroup(group);
    setSelectedUser(null);
  };

  const toggleMember = (user: any) => {
    setSelectedMembers(prev => 
      prev.find(m => m.id === user.id) 
        ? prev.filter(m => m.id !== user.id)
        : [...prev, user]
    );
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const res = await searchUsersAction(query);
    if (res.success) {
      setSearchResults(res.users || []);
    }
  };

  const startConversation = (user: any) => {
    if (isCreatingGroup) {
      toggleMember(user);
    } else {
      setSelectedUser(user);
      setSelectedGroup(null);
      setSearchQuery('');
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }}>Loading conversations...</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingTop: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <MessageSquare size={28} style={{ color: 'var(--accent-secondary)' }} />
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Messages</h1>
      </div>

      <div className="glass-card" style={{ 
        borderRadius: '16px', overflow: 'hidden', display: 'flex', height: '75vh',
        position: 'relative'
      }}>
        {/* Sidebar - hidden on mobile when a chat is selected */}
        <div style={{ 
          width: (selectedUser || selectedGroup) ? '320px' : '100%', 
          borderRight: '1px solid var(--border-light)', 
          display: ((selectedUser || selectedGroup) && isMobile) ? 'none' : 'flex', 
          flexDirection: 'column',
          flexShrink: 0
        }}>
          <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-glass)', borderRadius: '12px', padding: '10px 16px' }}>
                <Search size={18} style={{ color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  placeholder={isCreatingGroup ? "Add members..." : "Search people..."}
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', width: '100%', fontSize: '0.95rem' }} 
                />
              </div>
              <button 
                onClick={() => {
                  setIsCreatingGroup(!isCreatingGroup);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                style={{ 
                  width: '42px', height: '42px', borderRadius: '12px', 
                  background: isCreatingGroup ? 'var(--accent-primary)' : 'var(--bg-glass)',
                  border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', cursor: 'pointer'
                }}
                title="Create Group"
              >
                {isCreatingGroup ? <X size={20} /> : <Users size={20} />}
              </button>
            </div>

            {isCreatingGroup && (
              <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid var(--accent-primary)' }}>
                <input 
                  type="text" 
                  placeholder="Group Name" 
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  style={{ background: 'none', border: 'none', borderBottom: '1px solid var(--border-light)', outline: 'none', color: 'var(--text-primary)', width: '100%', fontSize: '0.95rem', marginBottom: '12px', padding: '4px 0' }}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
                  {selectedMembers.map(m => (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--accent-primary)', padding: '2px 8px', borderRadius: '20px', fontSize: '0.75rem' }}>
                      {m.username}
                      <X size={12} style={{ cursor: 'pointer' }} onClick={() => toggleMember(m)} />
                    </div>
                  ))}
                </div>
                <button 
                  onClick={createGroup}
                  disabled={!groupName.trim() || selectedMembers.length === 0}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'var(--accent-primary)', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer', opacity: (!groupName.trim() || selectedMembers.length === 0) ? 0.5 : 1 }}
                >
                  Create Group
                </button>
              </div>
            )}
            <button 
              onClick={async () => {
                if (!currentUser) return;
                await supabase.from('messages').update({ is_read: true }).eq('recipient_id', currentUser.id).eq('is_read', false);
                window.dispatchEvent(new Event('messages_read'));
                fetchConversations(currentUser.id);
              }}
              style={{ 
                marginTop: '12px', width: '100%', padding: '8px', borderRadius: '8px', 
                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)',
                color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer'
              }}
            >
              Mark all as read
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {searchQuery ? (
              <div style={{ padding: '0 8px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', padding: '8px 16px', textTransform: 'uppercase' }}>Search Results</div>
                {searchResults.length > 0 ? searchResults.map((user) => (
                  <div key={user.id} onClick={() => startConversation(user)} style={{
                    padding: '12px 16px', cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'center',
                    borderRadius: '12px', transition: 'all 0.2s',
                    background: selectedMembers.find(m => m.id === user.id) ? 'rgba(var(--accent-primary-rgb), 0.2)' : 'transparent'
                  }} className="hover-glass">
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', overflow: 'hidden', position: 'relative' }}>
                      {user.avatar_url ? <img src={user.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : user.full_name?.[0]}
                      {selectedMembers.find(m => m.id === user.id) && (
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Check size={20} color="white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{user.full_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>@{user.username}</div>
                    </div>
                  </div>
                )) : (
                  <div style={{ padding: '20px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No users found</div>
                )}
              </div>
            ) : conversations.length > 0 ? (
              conversations.map((conv, idx) => (
                <div key={conv.type === 'dm' ? conv.user.id : conv.group.id} onClick={() => {
                  if (conv.type === 'dm') {
                    setSelectedUser(conv.user);
                    setSelectedGroup(null);
                  } else {
                    setSelectedGroup(conv.group);
                    setSelectedUser(null);
                  }
                }} style={{
                  padding: '16px', cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'center',
                  background: (conv.type === 'dm' ? selectedUser?.id === conv.user.id : selectedGroup?.id === conv.group.id) ? 'var(--bg-glass-hover)' : 'transparent',
                  borderLeft: (conv.type === 'dm' ? selectedUser?.id === conv.user.id : selectedGroup?.id === conv.group.id) ? '4px solid var(--accent-secondary)' : '4px solid transparent',
                  transition: 'all 0.2s'
                }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
                    background: conv.type === 'dm' ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' : 'linear-gradient(135deg, #10b981, #3b82f6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', overflow: 'hidden'
                  }}>
                    {conv.type === 'dm' ? (
                      conv.user.avatar_url ? <img src={conv.user.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : conv.user.full_name?.[0]
                    ) : (
                      conv.group.avatar_url ? <img src={conv.group.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Users size={24} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{conv.type === 'dm' ? conv.user.full_name : conv.group.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{conv.time}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {conv.type === 'group' && <span style={{ color: 'var(--accent-secondary)', marginRight: '4px' }}>Group:</span>}
                      {conv.lastMsg}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                No messages yet.
              </div>
            )}
          </div>
        </div>

        {/* Chat area - hidden on mobile when no chat is selected */}
        <div style={{ 
          flex: 1, 
          display: (!(selectedUser || selectedGroup) && isMobile) ? 'none' : 'flex', 
          flexDirection: 'column', 
          background: 'rgba(0,0,0,0.2)',
          width: '100%'
        }}>
          {(selectedUser || selectedGroup) ? (
            <>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: '12px', alignItems: 'center', background: 'var(--bg-glass)' }}>
                {typeof window !== 'undefined' && window.innerWidth < 640 && (
                  <button onClick={() => { setSelectedUser(null); setSelectedGroup(null); }} style={{ marginRight: '8px', color: 'var(--text-secondary)' }}>
                    <ArrowLeft size={24} />
                  </button>
                )}
                <div style={{ 
                  width: '40px', height: '40px', borderRadius: '50%', 
                  background: selectedUser ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' : 'linear-gradient(135deg, #10b981, #3b82f6)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', overflow: 'hidden' 
                }}>
                  {selectedUser ? (
                    selectedUser.avatar_url ? <img src={selectedUser.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : selectedUser.full_name?.[0]
                  ) : (
                    selectedGroup.avatar_url ? <img src={selectedGroup.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Users size={20} />
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: '700' }}>{selectedUser ? selectedUser.full_name : selectedGroup.name}</div>
                  <div style={{ fontSize: '0.8rem', color: selectedUser ? 'var(--accent-neon)' : 'var(--text-secondary)' }}>
                    {selectedUser ? 'Online' : 'Group Chat'}
                  </div>
                </div>
              </div>
              <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender_id === currentUser.id ? 'flex-end' : 'flex-start' }}>
                    {selectedGroup && msg.sender_id !== currentUser.id && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginLeft: '12px', marginBottom: '2px' }}>
                        {msg.sender?.full_name || 'User'}
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: msg.sender_id === currentUser.id ? 'flex-end' : 'flex-start', width: '100%' }}>
                      <div style={{
                        maxWidth: '75%', padding: msg.message_type === 'sticker' ? '0' : '12px 16px', 
                        borderRadius: msg.sender_id === currentUser.id ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                        background: msg.message_type === 'sticker' ? 'transparent' : (msg.sender_id === currentUser.id ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' : 'var(--bg-glass)'),
                        fontSize: '0.95rem', lineHeight: '1.5', boxShadow: msg.message_type === 'sticker' ? 'none' : '0 4px 12px rgba(0,0,0,0.1)',
                        display: 'flex', flexDirection: 'column', gap: '8px'
                      }}>
                        {msg.post_id && msg.posts && (
                          <div style={{ 
                            background: 'rgba(0,0,0,0.2)', borderRadius: '12px', overflow: 'hidden', 
                            border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
                            width: '240px'
                          }} onClick={() => router.push(`/post/${msg.post_id}`)}>
                            {msg.posts.media_urls?.[0] && (
                              <div style={{ width: '100%', aspectRatio: '16/9', overflow: 'hidden' }}>
                                {msg.posts.media_urls[0].includes('mp4') ? (
                                  <video src={msg.posts.media_urls[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                                ) : (
                                  <img src={msg.posts.media_urls[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                )}
                              </div>
                            )}
                            <div style={{ padding: '10px', fontSize: '0.85rem' }}>
                              <div style={{ fontWeight: 'bold', color: 'var(--accent-secondary)', marginBottom: '4px' }}>Shared Post</div>
                              <div style={{ opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.posts.content}</div>
                            </div>
                          </div>
                        )}
                        {msg.message_type === 'sticker' ? (
                          <img src={msg.sticker_url} style={{ width: '120px', height: '120px' }} alt="sticker" />
                        ) : (
                          <div>{msg.content}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '20px', borderTop: '1px solid var(--border-light)', display: 'flex', gap: '12px', alignItems: 'center', background: 'var(--bg-glass)', position: 'relative' }}>
                <button 
                  onClick={() => setShowStickers(!showStickers)}
                  style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                >
                  <Smile size={24} />
                </button>
                
                {showStickers && (
                  <div className="glass-card" style={{ 
                    position: 'absolute', bottom: '100%', left: '20px', width: '280px', 
                    padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px',
                    borderRadius: '16px', marginBottom: '12px', zIndex: 100,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)', border: '1px solid var(--border-light)'
                  }}>
                    {STICKERS.map((s, i) => (
                      <img 
                        key={i} src={s} 
                        style={{ width: '100%', cursor: 'pointer', borderRadius: '8px' }} 
                        className="hover-scale"
                        onClick={() => handleSend(s)}
                      />
                    ))}
                  </div>
                )}

                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message..."
                  style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)', borderRadius: '24px', padding: '12px 20px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem' }}
                />
                <button 
                  onClick={() => handleSend()}
                  className="btn-primary" 
                  style={{ width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                >
                  <Send size={20} />
                </button>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', padding: '20px', textAlign: 'center' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <MessageSquare size={40} />
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Your Messages</h3>
              <p style={{ maxWidth: '300px' }}>Select a friend or create a group to start sharing moments and stickers!</p>
              <button 
                onClick={() => setIsCreatingGroup(true)}
                className="btn-primary" 
                style={{ marginTop: '20px', padding: '10px 24px' }}
              >
                Create a Group
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
