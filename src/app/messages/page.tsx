'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { MessageSquare, Send, Search, User, Loader2, ArrowLeft, Smile, X, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { searchUsersAction } from '@/app/actions/social';
import { getMyE2EEKeys, deriveSharedKey, encryptE2EE, decryptE2EE } from '@/utils/e2ee';
import { Shield, ShieldCheck, Lock } from 'lucide-react';

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

const normalizeJoin = (val: any) => {
  if (Array.isArray(val)) return val[0];
  return val;
};

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
  const [showStickers, setShowStickers] = useState(false);
  const [sharedKeys, setSharedKeys] = useState<Record<string, CryptoKey>>({});

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

      // Check for 'user' param in URL to auto-select a chat
      const params = new URLSearchParams(window.location.search);
      const targetUserId = params.get('user');
      if (targetUserId) {
        const { data: targetProfile } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, public_key')
          .eq('id', targetUserId)
          .single();
        
        if (targetProfile) {
          setSelectedUser(targetProfile);
        }
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchConversations(currentUser.id);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    const handleManualRefresh = () => {
      if (currentUser) fetchConversations(currentUser.id);
    };

    window.addEventListener('messages_read', handleManualRefresh);
    return () => window.removeEventListener('messages_read', handleManualRefresh);
  }, [currentUser]);

  useEffect(() => {
    if (selectedUser && currentUser) {
      fetchMessages(selectedUser.id);
      
      const channel = supabase
        .channel('realtime_messages_' + selectedUser.id)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'messages'
        }, async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new;
            if ((newMsg.sender_id === selectedUser.id && newMsg.recipient_id === currentUser.id) ||
                (newMsg.sender_id === currentUser.id && newMsg.recipient_id === selectedUser.id)) {
              
              // Decrypt if needed
              if (newMsg.is_encrypted) {
                const key = await getOrDeriveKey(selectedUser.id, selectedUser.public_key);
                if (key) {
                  newMsg.content = await decryptE2EE(newMsg.content, key);
                }
              }

              // Fetch post if shared
              let postData = null;
              if (newMsg.post_id) {
                const { data: post } = await supabase.from('posts').select('*, author:profiles(username, avatar_url)').eq('id', newMsg.post_id).single();
                postData = post;
              }
              
              setMessages(prev => {
                const isDuplicate = prev.some(m => m.id === newMsg.id || (m.content === newMsg.content && m.sender_id === newMsg.sender_id && m.isOptimistic));
                if (isDuplicate && !prev.some(m => m.id === newMsg.id)) {
                  return prev.map(m => (m.content === newMsg.content && m.sender_id === newMsg.sender_id && m.isOptimistic) ? { ...newMsg, posts: postData } : m);
                }
                if (prev.some(m => m.id === newMsg.id)) return prev;
                return [...prev, { ...newMsg, posts: postData }];
              });

              if (newMsg.sender_id === selectedUser.id) markAsRead(newMsg.id);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedMsg = payload.new;
            setMessages(prev => prev.map(m => m.id === updatedMsg.id ? { ...m, is_read: updatedMsg.is_read } : m));
          }
          fetchConversations(currentUser.id);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedUser, currentUser]);

  const markAsRead = async (msgId: string) => {
    await supabase.from('messages').update({ is_read: true }).eq('id', msgId);
    window.dispatchEvent(new Event('messages_read'));
  };

  const getOrDeriveKey = async (otherUserId: string, otherPubJWK: string) => {
    if (sharedKeys[otherUserId]) return sharedKeys[otherUserId];
    const myKeys = getMyE2EEKeys();
    if (!myKeys || !otherPubJWK) return null;
    const key = await deriveSharedKey(myKeys.privateKey, otherPubJWK);
    if (key) {
      setSharedKeys(prev => ({ ...prev, [otherUserId]: key }));
    }
    return key;
  };

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const fetchConversations = async (userId: string) => {
    const { data: dmData } = await supabase
      .from('messages')
      .select(`
        sender_id,
        recipient_id,
        content,
        message_type,
        created_at,
        is_read,
        is_encrypted,
        sender:profiles!sender_id(id, username, full_name, avatar_url, public_key),
        recipient:profiles!recipient_id(id, username, full_name, avatar_url, public_key)
      `)
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .is('group_id', null)
      .order('created_at', { ascending: false });

    // Fetch unread status for all conversations at once
    const { data: unreadCounts } = await supabase
      .from('messages')
      .select('sender_id')
      .eq('recipient_id', userId)
      .eq('is_read', false);

    const unreadSenderIds = new Set(unreadCounts?.map(m => m.sender_id) || []);

    const convs: any[] = [];
    const seen = new Set();

    if (dmData) {
      for (const msg of dmData as any[]) {
        const otherUser = msg.sender_id === userId ? normalizeJoin(msg.recipient) : normalizeJoin(msg.sender);
        if (otherUser && !seen.has(otherUser.id)) {
          let lastMsg = msg.message_type === 'sticker' ? 'Sent a sticker' : (msg.content || '');
          
          if (msg.is_encrypted && otherUser.public_key) {
            const key = await getOrDeriveKey(otherUser.id, otherUser.public_key);
            if (key) {
              lastMsg = await decryptE2EE(msg.content, key);
            } else {
              lastMsg = '🔐 Encrypted message';
            }
          }

          convs.push({
            user: otherUser,
            lastMsg,
            time: msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            timestamp: msg.created_at ? new Date(msg.created_at).getTime() : 0,
            isUnread: unreadSenderIds.has(otherUser.id)
          });
          seen.add(otherUser.id);
        }
      }
    }

    setConversations(convs.sort((a, b) => b.timestamp - a.timestamp));
    setLoading(false);
  };

  const fetchMessages = async (otherUserId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*, posts:post_id(id, content, media_urls)')
      .or(`and(sender_id.eq.${currentUser.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${currentUser.id})`)
      .order('created_at', { ascending: true });

    if (data) {
      const decryptedMessages = await Promise.all((data as any[]).map(async (msg) => {
        if (msg.is_encrypted) {
          const key = await getOrDeriveKey(otherUserId, selectedUser?.public_key);
          if (key) {
            try {
              return { ...msg, content: await decryptE2EE(msg.content, key) };
            } catch (e) {
              return { ...msg, content: '🔐 [Encryption Key Mismatch]' };
            }
          }
          return { ...msg, content: '🔐 [Encrypted]' };
        }
        return msg;
      }));
      setMessages(decryptedMessages);
    }

    try {
      const { data: unread } = await supabase
        .from('messages')
        .select('id')
        .eq('recipient_id', currentUser.id)
        .eq('sender_id', otherUserId)
        .eq('is_read', false)
        .limit(1);

      if (unread && unread.length > 0) {
        const { error } = await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('recipient_id', currentUser.id)
          .eq('sender_id', otherUserId)
          .eq('is_read', false);
        
        if (!error) {
          window.dispatchEvent(new Event('messages_read'));
        }
      }
    } catch (e) {
      console.error('Error marking messages as read:', e);
    }
  };

  const handleSend = async (stickerUrl?: string) => {
    if ((!input.trim() && !stickerUrl) || !selectedUser || !currentUser) return;

    const newMsg: any = {
      sender_id: currentUser.id,
      recipient_id: selectedUser.id,
      content: stickerUrl ? '' : input,
      message_type: stickerUrl ? 'sticker' : 'text',
      sticker_url: stickerUrl || null,
      is_encrypted: false
    };

    // Apply E2EE if recipient has a public key
    if (selectedUser.public_key && !stickerUrl) {
      const key = await getOrDeriveKey(selectedUser.id, selectedUser.public_key);
      if (key) {
        newMsg.content = await encryptE2EE(input, key);
        newMsg.is_encrypted = true;
      }
    }

    const optimisticMsg = { 
      ...newMsg, 
      id: Math.random().toString(),
      isOptimistic: true,
      created_at: new Date().toISOString(),
      sender: {
        id: currentUser.id,
        full_name: currentUser.user_metadata?.full_name || currentUser.email || 'Me',
        avatar_url: currentUser.user_metadata?.avatar_url
      }
    };
    setMessages(prev => [...prev, optimisticMsg]);
    if (!stickerUrl) setInput('');
    setShowStickers(false);

    const { error } = await supabase.from('messages').insert(newMsg);
    if (error) {
      alert('Failed to send message: ' + error.message);
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
    } else {
      fetchConversations(currentUser.id);
    }
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
    setSelectedUser(user);
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }}>Loading conversations...</div>;

  return (
    <div style={{ padding: '10px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <MessageSquare size={28} style={{ color: 'var(--accent-secondary)' }} />
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Messages</h1>
      </div>

      <div className="glass-card" style={{ 
        borderRadius: '16px', overflow: 'hidden', display: 'flex', height: '75vh',
        position: 'relative'
      }}>
        {/* Sidebar */}
        <div style={{ 
          width: selectedUser ? (isMobile ? '100%' : '320px') : '100%', 
          borderRight: '1px solid var(--border-light)', 
          display: (selectedUser && isMobile) ? 'none' : 'flex', 
          flexDirection: 'column',
          flexShrink: 0,
          minWidth: 0
        }}>
          <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-glass)', borderRadius: '12px', padding: '10px 16px' }}>
                <Search size={18} style={{ color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  placeholder="Search people..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', width: '100%', fontSize: '0.95rem' }} 
                />
              </div>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {searchQuery ? (
              <div style={{ padding: '0 8px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', padding: '8px 16px', textTransform: 'uppercase' }}>Search Results</div>
                {searchResults.length > 0 ? searchResults.map((user) => (
                  <div key={user.id} onClick={() => startConversation(user)} style={{
                    padding: '12px 16px', cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'center',
                    borderRadius: '12px', transition: 'all 0.2s'
                  }} className="hover-glass">
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', overflow: 'hidden' }}>
                      {user.avatar_url ? <img src={user.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : user.full_name?.[0]}
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
              conversations.map((conv) => (
                <div key={conv.user.id} onClick={() => setSelectedUser(conv.user)} style={{
                  padding: '16px', cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'center',
                  background: selectedUser?.id === conv.user.id ? 'var(--bg-glass-hover)' : 'transparent',
                  borderLeft: selectedUser?.id === conv.user.id ? '4px solid var(--accent-secondary)' : '4px solid transparent',
                  transition: 'all 0.2s'
                }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', overflow: 'hidden'
                  }}>
                    {conv.user.avatar_url ? <img src={conv.user.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : conv.user.full_name?.[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: conv.isUnread ? '800' : '700', fontSize: '0.95rem', color: conv.isUnread ? 'var(--text-primary)' : 'inherit' }}>{conv.user.full_name}</span>
                      <span style={{ fontSize: '0.75rem', color: conv.isUnread ? 'var(--accent-neon)' : 'var(--text-secondary)', fontWeight: conv.isUnread ? 'bold' : 'normal' }}>{conv.time}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      <div style={{ 
                        fontSize: '0.85rem', 
                        color: conv.isUnread ? 'var(--text-primary)' : 'var(--text-secondary)', 
                        fontWeight: conv.isUnread ? '600' : 'normal',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        flex: 1
                      }}>
                        {conv.lastMsg}
                      </div>
                      {conv.isUnread && (
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-neon)', flexShrink: 0, boxShadow: '0 0 10px var(--accent-neon)' }} />
                      )}
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

        {/* Chat area */}
        <div style={{ 
          flex: 1, 
          display: (!selectedUser && isMobile) ? 'none' : 'flex', 
          flexDirection: 'column', 
          background: '#ffffff',
          minWidth: 0
        }}>
          {selectedUser ? (
            <>
              <div style={{ padding: '16px', borderBottom: '1px solid #eeeeee', display: 'flex', gap: '12px', alignItems: 'center', background: '#ffffff' }}>
                {isMobile && (
                  <button onClick={() => setSelectedUser(null)} style={{ marginRight: '8px', color: '#666666', background: 'none', border: 'none' }}>
                    <ArrowLeft size={24} />
                  </button>
                )}
                <div style={{ 
                  width: '40px', height: '40px', borderRadius: '50%', 
                  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', overflow: 'hidden' 
                }}>
                  {selectedUser.avatar_url ? <img src={selectedUser.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : selectedUser.full_name?.[0]}
                </div>
                <div>
                  <div style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {selectedUser.full_name}
                    {selectedUser.public_key && <span title="End-to-end encrypted"><ShieldCheck size={14} style={{ color: 'var(--accent-neon)' }} /></span>}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--accent-neon)' }}>Online</div>
                </div>
              </div>
              <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#f8f9fa' }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: msg.sender_id === currentUser.id ? 'flex-end' : 'flex-start', width: '100%' }}>
                    <div style={{
                      maxWidth: '75%', padding: msg.message_type === 'sticker' ? '0' : '12px 16px', 
                      borderRadius: msg.sender_id === currentUser.id ? '20px 20px 4px 20px' : '20px 20px 20px 20px',
                      background: msg.message_type === 'sticker' ? 'transparent' : (msg.sender_id === currentUser.id ? 'var(--accent-primary)' : '#e4e6eb'),
                      color: msg.sender_id === currentUser.id ? '#ffffff' : '#000000',
                      fontSize: '0.95rem', lineHeight: '1.5', 
                      boxShadow: msg.message_type === 'sticker' ? 'none' : '0 2px 8px rgba(0,0,0,0.05)',
                      border: 'none',
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
                              {typeof msg.posts.media_urls[0] === 'string' && msg.posts.media_urls[0].includes('mp4') ? (
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
                        <div style={{ position: 'relative' }}>
                          <img src={msg.sticker_url} style={{ width: '120px', height: '120px' }} alt="sticker" />
                          {msg.sender_id === currentUser.id && (
                            <div style={{ position: 'absolute', bottom: '4px', right: '4px', display: 'flex' }}>
                              <Check size={14} style={{ color: msg.is_read ? 'var(--accent-neon)' : '#999' }} />
                              {msg.is_read && <Check size={14} style={{ color: 'var(--accent-neon)', marginLeft: '-8px' }} />}
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          <div>{msg.content}</div>
                          {msg.sender_id === currentUser.id && (
                            <div style={{ alignSelf: 'flex-end', display: 'flex', marginTop: '2px', opacity: 0.8 }}>
                              <Check size={14} style={{ color: msg.is_read ? '#fff' : 'rgba(255,255,255,0.6)' }} />
                              {msg.is_read && <Check size={14} style={{ color: '#fff', marginLeft: '-8px' }} />}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ 
                padding: '12px 16px', 
                borderTop: '1px solid #eeeeee', 
                display: 'flex', 
                gap: '8px', 
                alignItems: 'center', 
                background: '#ffffff', 
                position: 'relative',
                width: '100%',
                boxSizing: 'border-box'
              }}>
                <button 
                  onClick={() => setShowStickers(!showStickers)}
                  style={{ color: '#666666', background: 'none', border: 'none', cursor: 'pointer', padding: '8px', flexShrink: 0 }}
                >
                  <Smile size={24} />
                </button>
                
                {showStickers && (
                  <div className="glass-card" style={{ 
                    position: 'absolute', bottom: '100%', left: '12px', width: '260px', 
                    padding: '12px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px',
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
                  style={{ 
                    flex: 1, 
                    minWidth: 0,
                    background: '#f0f2f5', 
                    border: 'none', 
                    borderRadius: '24px', 
                    padding: '10px 16px', 
                    color: '#000000', 
                    outline: 'none', 
                    fontSize: '0.9rem' 
                  }}
                />
                <button 
                  onClick={() => handleSend()}
                  className="btn-primary" 
                  style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    flexShrink: 0,
                    padding: 0
                  }}
                >
                  <Send size={18} />
                </button>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', padding: '20px', textAlign: 'center' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <MessageSquare size={40} />
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Your Messages</h3>
              <p style={{ maxWidth: '300px' }}>Select a friend to start sharing moments and stickers!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
