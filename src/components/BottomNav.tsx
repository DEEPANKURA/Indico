'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, TrendingUp, MessageSquare, User } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';

const navItems = [
  { icon: Home,          label: 'Home',     href: '/' },
  { icon: Compass,       label: 'Explore',  href: '/explore' },
  { icon: TrendingUp,    label: 'Trending', href: '/trending' },
  { icon: MessageSquare, label: 'Messages', href: '/messages' },
  { icon: User,          label: 'Profile',  href: '/profile' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    const fetchUnread = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('is_read', false);
      
      setUnreadCount(count || 0);
    };

    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel('nav_notifications')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`
        }, (payload) => {
          console.log('Message change detected:', payload);
          fetchUnread();
        })
        .subscribe();

      return channel;
    };

    let channelInstance: any;
    
    const init = async () => {
      await fetchUnread();
      channelInstance = await setupSubscription();
    };

    init();

    const handleManualRefresh = () => {
      console.log('Manual unread refresh triggered in BottomNav');
      fetchUnread();
    };

    window.addEventListener('messages_read', handleManualRefresh);

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchUnread();
      }
    }, 10000);

    return () => {
      if (channelInstance) {
        supabase.removeChannel(channelInstance);
      }
      window.removeEventListener('messages_read', handleManualRefresh);
      clearInterval(interval);
    };
  }, []);

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const isMessages = item.label === 'Messages';
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`bottom-nav-item${isActive ? ' active' : ''}`}
            style={{ position: 'relative' }}
          >
            <div style={{ position: 'relative' }}>
              <item.icon size={22} />
              {isMessages && unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: '-6px', right: '-8px',
                  background: 'var(--accent-neon)', color: 'white',
                  fontSize: '0.65rem', fontWeight: 'bold',
                  padding: '2px 5px', borderRadius: '10px',
                  border: '2px solid var(--bg-primary)',
                  minWidth: '18px', textAlign: 'center',
                  boxShadow: '0 0 10px rgba(255,0,255,0.4)'
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
