'use client';

import { useState, useEffect } from 'react';
import { Bell, Heart, MessageCircle, UserPlus, Reply, X } from 'lucide-react';
import { getNotificationsAction, markNotificationsAsReadAction } from '@/app/actions/notifications';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      const res = await getNotificationsAction();
      if (res.success && res.notifications) {
        setNotifications(res.notifications);
        setUnreadCount(res.notifications.filter((n: any) => !n.is_read).length);
      }
    };

    fetchNotifications();
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleOpen = async () => {
    setShowDropdown(!showDropdown);
    if (!showDropdown && unreadCount > 0) {
      await markNotificationsAsReadAction();
      setUnreadCount(0);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart size={16} fill="var(--accent-neon)" color="var(--accent-neon)" />;
      case 'comment': return <MessageCircle size={16} color="var(--accent-secondary)" />;
      case 'follow': return <UserPlus size={16} color="var(--accent-primary)" />;
      case 'reply': return <Reply size={16} color="var(--accent-secondary)" />;
      default: return <Bell size={16} />;
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button 
        onClick={handleOpen}
        style={{ 
          width: '44px', height: '44px', borderRadius: '50%', background: 'var(--bg-glass)',
          border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: unreadCount > 0 ? 'var(--accent-secondary)' : 'var(--text-primary)', cursor: 'pointer',
          position: 'relative'
        }}
      >
        <Bell size={22} fill={unreadCount > 0 ? 'var(--accent-secondary)' : 'none'} />
        {unreadCount > 0 && (
          <span style={{ 
            position: 'absolute', top: '10px', right: '10px', width: '10px', height: '10px',
            background: 'var(--accent-neon)', borderRadius: '50%', border: '2px solid var(--bg-primary)'
          }}></span>
        )}
      </button>

      {showDropdown && (
        <div style={{ 
          position: 'absolute', top: '55px', right: 0, width: '360px', maxHeight: '520px',
          background: 'var(--bg-secondary)', border: '1px solid var(--border-light)',
          borderRadius: '16px', boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
          overflowY: 'auto', zIndex: 1000, display: 'flex', flexDirection: 'column',
          animation: 'slideIn 0.2s ease-out'
        }}>
          <div style={{ 
            padding: '16px 20px', borderBottom: '1px solid var(--border-light)', 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 10
          }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>Activity</h3>
            <button onClick={() => setShowDropdown(false)} style={{ color: 'var(--text-secondary)' }}>
              <X size={20} />
            </button>
          </div>

          <div style={{ padding: '8px 0' }}>
            {notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                <Bell size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
                <p style={{ margin: 0 }}>No activity yet</p>
              </div>
            ) : (
              notifications.map((n) => {
                const profile = Array.isArray(n.actor) ? n.actor[0] : n.actor;
                return (
                  <div key={n.id} style={{ 
                    display: 'flex', gap: '12px', alignItems: 'center', padding: '12px 20px',
                    background: n.is_read ? 'transparent' : 'rgba(var(--accent-primary-rgb), 0.05)',
                    transition: 'background 0.2s',
                    cursor: 'pointer'
                  }} className="notification-item">
                    {/* Avatar */}
                    <div style={{ 
                      width: '44px', height: '44px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                      border: '1px solid var(--border-light)',
                      background: 'var(--bg-glass)'
                    }}>
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-primary)', color: 'white', fontWeight: 'bold' }}>
                          {profile?.full_name?.[0] || '?'}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.9rem', margin: 0, lineHeight: '1.4' }}>
                        <span style={{ fontWeight: '700' }}>{profile?.username || 'user'}</span>{' '}
                        {n.type === 'like' && 'liked your post.'}
                        {n.type === 'comment' && 'commented on your post.'}
                        {n.type === 'follow' && 'started following you.'}
                        {n.type === 'reply' && 'replied to your comment.'}
                        <span style={{ color: 'var(--text-muted)', marginLeft: '6px', fontSize: '0.8rem' }}>
                          {new Date(n.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </p>
                    </div>

                    {/* Action Button / Icon */}
                    <div style={{ flexShrink: 0 }}>
                      {n.type === 'follow' ? (
                        <button style={{ 
                          background: 'var(--accent-primary)', color: 'white', border: 'none',
                          borderRadius: '8px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: '700'
                        }}>
                          Follow
                        </button>
                      ) : n.type === 'like' ? (
                        <Heart size={18} fill="var(--accent-neon)" color="var(--accent-neon)" />
                      ) : (
                        <div style={{ color: 'var(--text-muted)' }}>{getIcon(n.type)}</div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
