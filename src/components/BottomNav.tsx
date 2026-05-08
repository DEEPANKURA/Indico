'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, TrendingUp, MessageSquare, User } from 'lucide-react';

const navItems = [
  { icon: Home,          label: 'Home',     href: '/' },
  { icon: Compass,       label: 'Explore',  href: '/explore' },
  { icon: TrendingUp,    label: 'Trending', href: '/trending' },
  { icon: MessageSquare, label: 'Messages', href: '/messages' },
  { icon: User,          label: 'Profile',  href: '/profile' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`bottom-nav-item${isActive ? ' active' : ''}`}
          >
            <item.icon size={22} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
