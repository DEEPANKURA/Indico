import PostCard from "@/components/PostCard";
import { Sparkles, Info } from "lucide-react";

export default function Home() {
  const dummyPosts = [
    {
      id: "1",
      author: {
        name: "DEEP ANKURA",
        handle: "@deepankura",
        avatar: "",
        isNew: true,
      },
      content: "Just dropped a new guitar cover. Tell me what you think! Working on some new beats later today.",
      mediaUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop",
      mediaType: "video" as const,
      likes: "12.4K",
      comments: "342",
      shares: "1.2K",
      tags: ["indico", "viral", "music", "trending"],
      timeAgo: "2h ago",
    },
    {
      id: "2",
      author: {
        name: "CyberPunk Art",
        handle: "@neon_dreams",
        avatar: "",
        isNew: false,
      },
      content: "Rendered this in Blender using the new AI node setup. The lighting is 100% raytraced.",
      mediaUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2564&auto=format&fit=crop",
      mediaType: "image" as const,
      likes: "8.9K",
      comments: "156",
      shares: "890",
      tags: ["3dart", "blender", "cyberpunk", "aigenerated"],
      timeAgo: "4h ago",
    }
  ];

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingTop: '10px' }}>
      {/* Header / Feed Tabs */}
      <div className="glass-card" style={{ 
        display: 'flex', alignItems: 'center', gap: '8px', 
        padding: '8px', marginBottom: '24px', position: 'sticky', top: '10px', zIndex: 10 
      }}>
        <button className="btn-primary" style={{ flex: 1 }}>For You</button>
        <button className="btn-secondary" style={{ flex: 1, border: 'none', background: 'transparent' }}>Following</button>
        <button className="btn-secondary" style={{ flex: 1, border: 'none', background: 'transparent' }}>Trending</button>
        <button className="btn-secondary" style={{ flex: 1, border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <Sparkles size={16} className="text-gradient" />
          <span className="text-gradient font-bold">AI Pick</span>
        </button>
      </div>

      {/* Info Banner */}
      <div style={{ 
        background: 'rgba(0, 255, 255, 0.05)', 
        border: '1px solid rgba(0, 255, 255, 0.2)',
        borderRadius: '12px', padding: '16px', marginBottom: '24px',
        display: 'flex', gap: '12px', alignItems: 'flex-start'
      }}>
        <Info size={20} className="text-gradient" style={{ flexShrink: 0, marginTop: '2px' }} />
        <p className="text-sm">
          <span className="text-gradient" style={{ fontWeight: 'bold' }}>Fair Algorithm Active — </span> 
          Posts are currently ranked by content quality, watch time, and completion rate. New creators receive equal exposure testing.
        </p>
      </div>

      {/* Feed */}
      <div className="feed-container">
        {dummyPosts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
