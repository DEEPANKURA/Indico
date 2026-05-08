'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { MessageSquare, Send, Search, User, Loader2 } from 'lucide-react';
import { searchUsersAction } from '@/app/actions/social';

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

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUser(user);
      fetchConversations(user.id);
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedUser && currentUser) {
      fetchMessages(selectedUser.id);
      
      // Subscribe to new messages
      const channel = supabase
        .channel('realtime_messages')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `recipient_id=eq.${currentUser.id}` 
        }, (payload) => {
          if (payload.new.sender_id === selectedUser.id) {
            setMessages(prev => [...prev, payload.new]);
          }
          fetchConversations(currentUser.id);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedUser, currentUser]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const fetchConversations = async (userId: string) => {
    // This is a simplified way to get conversations. 
    // In a production app, you'd have a separate conversations table or a more complex query.
    const { data, error } = await supabase
      .from('messages')
      .select(`
        sender_id,
        recipient_id,
        content,
        created_at,
        sender:profiles!sender_id(id, username, full_name, avatar_url),
        recipient:profiles!recipient_id(id, username, full_name, avatar_url)
      `)
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (data) {
      const convs: any[] = [];
      const seen = new Set();
      data.forEach(msg => {
        const otherUser = msg.sender_id === userId ? msg.recipient : msg.sender;
        if (!seen.has(otherUser.id)) {
          convs.push({
            user: otherUser,
            lastMsg: msg.content,
            time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
          seen.add(otherUser.id);
        }
      });
      setConversations(convs);
    }
    setLoading(false);
  };

  const fetchMessages = async (otherUserId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUser.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${currentUser.id})`)
      .order('created_at', { ascending: true });

    if (data) setMessages(data);
  };

  const handleSend = async () => {
    if (!input.trim() || !selectedUser || !currentUser) return;

    const newMsg = {
      sender_id: currentUser.id,
      recipient_id: selectedUser.id,
      content: input
    };

    // Optimistic update
    setMessages(prev => [...prev, { ...newMsg, created_at: new Date().toISOString() }]);
    setInput('');

    const { error } = await supabase.from('messages').insert(newMsg);
    if (error) {
      alert('Failed to send message');
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
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingTop: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <MessageSquare size={28} style={{ color: 'var(--accent-secondary)' }} />
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Messages</h1>
      </div>

      <div className="glass-card" style={{ borderRadius: '16px', overflow: 'hidden', display: 'flex', height: '75vh' }}>
        {/* Sidebar */}
        <div style={{ width: '320px', borderRight: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-glass)', borderRadius: '12px', padding: '10px 16px' }}>
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
                      <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{conv.user.full_name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{conv.time}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.lastMsg}</div>
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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.2)' }}>
          {selectedUser ? (
            <>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: '12px', alignItems: 'center', background: 'var(--bg-glass)' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', overflow: 'hidden' }}>
                  {selectedUser.avatar_url ? <img src={selectedUser.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : selectedUser.full_name?.[0]}
                </div>
                <div>
                  <div style={{ fontWeight: '700' }}>{selectedUser.full_name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--accent-neon)' }}>Online</div>
                </div>
              </div>
              <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: msg.sender_id === currentUser.id ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '70%', padding: '12px 16px', borderRadius: msg.sender_id === currentUser.id ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                      background: msg.sender_id === currentUser.id ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' : 'var(--bg-glass)',
                      fontSize: '0.95rem', lineHeight: '1.5', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '20px', borderTop: '1px solid var(--border-light)', display: 'flex', gap: '12px', alignItems: 'center', background: 'var(--bg-glass)' }}>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message..."
                  style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)', borderRadius: '24px', padding: '12px 20px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem' }}
                />
                <button 
                  onClick={handleSend}
                  className="btn-primary" 
                  style={{ width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                >
                  <Send size={20} />
                </button>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <MessageSquare size={40} />
              </div>
              <h3>Your Messages</h3>
              <p>Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
