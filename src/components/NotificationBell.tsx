'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Heart, MessageCircle, UserPlus, Reply, X, Trash2 } from 'lucide-react';
import { getNotificationsAction, markNotificationsAsReadAction, deleteNotificationAction } from '@/app/actions/notifications';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import toast from 'react-hot-toast';

// --- Sub-component for individual Notification Item with Swipe to Delete ---
function NotificationItem({ n, onClick, onDelete }: { n: any, onClick: () => void, onDelete: (id: string) => void }) {
  const [swipeX, setSwipeX] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const profile = Array.isArray(n.actor) ? n.actor[0] : n.actor;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = e.touches[0].clientX - touchStartX.current;
    if (diff < 0) { // Only swipe left
      setSwipeX(Math.max(diff, -100)); // Max swipe 100px
    } else {
      setSwipeX(0);
    }
  };

  const handleTouchEnd = () => {
    if (swipeX < -70) {
      handleDelete();
    } else {
      setSwipeX(0);
    }
    touchStartX.current = null;
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const res = await deleteNotificationAction(n.id);
    if (res.success) {
      onDelete(n.id);
    } else {
      toast.error('Failed to delete notification');
      setSwipeX(0);
      setIsDeleting(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart size={14} fill="var(--accent-neon)" color="var(--accent-neon)" />;
      case 'comment': return <MessageCircle size={14} color="var(--accent-secondary)" />;
      case 'follow': return <UserPlus size={14} color="var(--accent-primary)" />;
      case 'reply': return <Reply size={14} color="var(--accent-secondary)" />;
      default: return <Bell size={14} />;
    }
  };

  if (isDeleting) return null;

  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: '#ff4b4b' }}>
      {/* Delete Background Label */}
      <div style={{ 
        position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)',
        color: 'white', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '0.8rem'
      }}>
        <Trash2 size={18} /> Delete
      </div>

      {/* Main Item */}
      <div 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => swipeX === 0 && onClick()}
        style={{ 
          display: 'flex', gap: '12px', alignItems: 'center', padding: '12px 20px',
          background: n.is_read ? 'var(--bg-secondary)' : 'rgba(138, 43, 226, 0.08)',
          transition: swipeX === 0 ? 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
          transform: `translateX(${swipeX}px)`,
          cursor: 'pointer',
          position: 'relative',
          borderBottom: '1px solid var(--border-light)'
        }} 
      >
        <div style={{ 
          width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
          border: '1px solid var(--border-light)', background: 'var(--bg-glass)'
        }}>
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-primary)', color: 'white', fontWeight: 'bold' }}>
              {profile?.username?.[0]?.toUpperCase() || '?'}
            </div>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '0.85rem', margin: 0, lineHeight: '1.4' }}>
            <span style={{ fontWeight: '700' }}>{profile?.username || 'user'}</span>{' '}
            {n.type === 'like' && 'liked your post.'}
            {n.type === 'comment' && 'commented on your post.'}
            {n.type === 'follow' && 'started following you.'}
            {n.type === 'reply' && 'replied to your comment.'}
          </p>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            {new Date(n.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </span>
        </div>

        <div style={{ flexShrink: 0, opacity: 0.8 }}>
          {getIcon(n.type)}
        </div>
      </div>
    </div>
  );
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();
  const supabase = createClient();

  const fetchNotifications = async () => {
    const res = await getNotificationsAction();
    if (res.success && res.notifications) {
      setNotifications(res.notifications);
      setUnreadCount(res.notifications.filter((n: any) => !n.is_read).length);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // --- REALTIME NOTIFICATIONS ---
    const channel = supabase
      .channel('realtime-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        () => {
          console.log('[Realtime] New notification received');
          fetchNotifications();
          toast('New notification! 🔔', { icon: '✨' });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleOpen = async () => {
    setShowDropdown(!showDropdown);
    if (!showDropdown && unreadCount > 0) {
      await markNotificationsAsReadAction();
      setUnreadCount(0);
    }
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleNotificationClick = (n: any) => {
    setShowDropdown(false);
    const profile = Array.isArray(n.actor) ? n.actor[0] : n.actor;
    
    switch (n.type) {
      case 'like':
      case 'comment':
      case 'reply':
        if (n.target_id) router.push(`/post/${n.target_id}`);
        break;
      case 'follow':
        if (profile?.username) router.push(`/profile/${n.actor_id}`);
        break;
      default:
        break;
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button 
        onClick={handleOpen}
        style={{ 
          width: '42px', height: '42px', borderRadius: '50%', background: 'var(--bg-glass)',
          border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: unreadCount > 0 ? 'var(--accent-secondary)' : 'var(--text-primary)', cursor: 'pointer',
          position: 'relative'
        }}
      >
        <Bell size={20} fill={unreadCount > 0 ? 'var(--accent-secondary)' : 'none'} />
        {unreadCount > 0 && (
          <span style={{ 
            position: 'absolute', top: '8px', right: '8px', width: '12px', height: '12px',
            background: 'var(--accent-neon)', borderRadius: '50%', border: '2px solid var(--bg-primary)',
            fontSize: '7px', color: 'black', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>{unreadCount}</span>
        )}
      </button>

      {showDropdown && (
        <div style={{ 
          position: 'absolute', top: '55px', right: 0, width: '340px', maxHeight: '500px',
          background: 'var(--bg-secondary)', border: '1px solid var(--border-light)',
          borderRadius: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          overflow: 'hidden', zIndex: 1000, display: 'flex', flexDirection: 'column',
          animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <div style={{ 
            padding: '16px 20px', borderBottom: '1px solid var(--border-light)', 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'var(--bg-glass)', backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '900', letterSpacing: '0.5px' }}>NOTIFICATIONS</h3>
            <button onClick={() => setShowDropdown(false)} style={{ color: 'var(--text-secondary)', background: 'none', border: 'none' }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }} className="no-scrollbar">
            {notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
                <Bell size={40} style={{ marginBottom: '12px', opacity: 0.1 }} />
                <p style={{ margin: 0, fontSize: '0.9rem' }}>Everything caught up!</p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationItem 
                  key={n.id} 
                  n={n} 
                  onClick={() => handleNotificationClick(n)} 
                  onDelete={handleDeleteNotification}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
