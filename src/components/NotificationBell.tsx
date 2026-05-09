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
      if (res.success) {
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
        <div className="glass-panel" style={{ 
          position: 'absolute', top: '55px', right: 0, width: '320px', maxHeight: '480px',
          overflowY: 'auto', zIndex: 100, padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '1rem' }}>Notifications</h3>
            <button onClick={() => setShowDropdown(false)}><X size={18} /></button>
          </div>

          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
              No notifications yet
            </div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '8px', borderRadius: '8px', background: n.is_read ? 'transparent' : 'rgba(255,255,255,0.05)' }}>
                <div style={{ 
                  width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))'
                }}>
                  {n.profiles?.avatar_url ? <img src={n.profiles.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '0.8rem' }}>{n.profiles?.full_name?.[0]}</div>}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.85rem', margin: 0 }}>
                    <span style={{ fontWeight: '700' }}>{n.profiles?.full_name}</span>{' '}
                    {n.type === 'like' && 'liked your post'}
                    {n.type === 'comment' && 'commented on your post'}
                    {n.type === 'follow' && 'started following you'}
                    {n.type === 'reply' && 'replied to your comment'}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    {getIcon(n.type)}
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(n.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
