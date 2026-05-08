'use client';

import { useEffect, useState, useRef } from 'react';
import { Radio, Users, Eye, Heart, Camera, StopCircle, Play, Loader2, X } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function LivePage() {
  const supabase = createClient();
  const [activeStreams, setActiveStreams] = useState<any[]>([]);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [showBroadcastPanel, setShowBroadcastPanel] = useState(false);
  const [streamTitle, setStreamTitle] = useState('');
  const [category, setCategory] = useState('Talk');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      fetchStreams();
    };
    init();

    // Subscribe to stream changes
    const channel = supabase
      .channel('live_streams_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_streams' }, () => {
        fetchStreams();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      stopCamera();
    };
  }, []);

  const fetchStreams = async () => {
    const { data } = await supabase
      .from('live_streams')
      .select(`
        *,
        profiles:streamer_id(username, full_name, avatar_url)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (data) setActiveStreams(data);
    setLoading(false);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 }, 
        audio: true 
      });
      streamRef.current = stream;
      setShowBroadcastPanel(true);
      // The video element will be rendered now, srcObject will be set in useEffect
    } catch (err) {
      console.error('Camera error:', err);
      alert('Could not access camera/microphone. Please ensure permissions are granted.');
    }
  };

  const [audioLevel, setAudioLevel] = useState(0);

  useEffect(() => {
    if (showBroadcastPanel && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      
      // Audio level meter
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(streamRef.current);
      source.connect(analyser);
      analyser.fftSize = 256;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      let animationId: number;
      const updateMeter = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average);
        animationId = requestAnimationFrame(updateMeter);
      };
      updateMeter();

      return () => {
        cancelAnimationFrame(animationId);
        audioContext.close();
      };
    }
  }, [showBroadcastPanel, isBroadcasting]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startStreaming = async () => {
    if (!streamTitle.trim()) return alert('Please enter a stream title');
    
    const { data, error } = await supabase
      .from('live_streams')
      .insert({
        streamer_id: user.id,
        title: streamTitle,
        category: category,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      alert('Failed to start stream');
    } else {
      setIsBroadcasting(true);
    }
  };

  const stopStreaming = async () => {
    if (!user) return;
    
    await supabase
      .from('live_streams')
      .update({ is_active: false })
      .eq('streamer_id', user.id)
      .eq('is_active', true);

    setIsBroadcasting(false);
    setShowBroadcastPanel(false);
    stopCamera();
    setStreamTitle('');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '10px', paddingBottom: '100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Radio size={28} style={{ color: '#ef4444' }} />
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Live</h1>
          <span style={{ background: '#ef4444', color: 'white', fontSize: '0.75rem', fontWeight: '700', padding: '3px 10px', borderRadius: '20px' }}>
            {activeStreams.length} ACTIVE
          </span>
        </div>
        
        {!showBroadcastPanel && (
          <button 
            onClick={startCamera}
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px' }}
          >
            <Camera size={20} />
            Go Live
          </button>
        )}
      </div>

      {showBroadcastPanel && (
        <div className="glass-card" style={{ marginBottom: '32px', borderRadius: '20px', overflow: 'hidden', border: '2px solid var(--accent-secondary)' }}>
          <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000' }}>
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              playsInline 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />

            {/* Audio Meter */}
            <div style={{ 
              position: 'absolute', bottom: '20px', left: '20px', 
              width: '120px', height: '6px', background: 'rgba(0,0,0,0.5)', 
              borderRadius: '10px', overflow: 'hidden', display: 'flex', alignItems: 'center'
            }}>
              <div style={{ 
                height: '100%', width: `${Math.min(100, audioLevel * 2)}%`,
                background: audioLevel > 30 ? '#10b981' : '#6366f1',
                transition: 'width 0.1s ease-out'
              }} />
              <div style={{ position: 'absolute', right: '4px', fontSize: '10px', color: 'white', opacity: 0.8 }}>MIC</div>
            </div>
            
            {isBroadcasting && (
              <div style={{ position: 'absolute', top: '20px', left: '20px', background: '#ef4444', color: 'white', padding: '4px 12px', borderRadius: '6px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white', animation: 'pulse 1.5s infinite' }} />
                LIVE
              </div>
            )}

            <button 
              onClick={isBroadcasting ? stopStreaming : () => { setShowBroadcastPanel(false); stopCamera(); }}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', padding: '8px', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          </div>

          <div style={{ padding: '24px' }}>
            {!isBroadcasting ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Stream Title</label>
                  <input 
                    type="text" 
                    placeholder="What are you doing today?" 
                    value={streamTitle}
                    onChange={(e) => setStreamTitle(e.target.value)}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '12px 16px', color: 'white', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Category</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '12px 16px', color: 'white', outline: 'none' }}
                  >
                    <option value="Talk">Talk</option>
                    <option value="Music">Music</option>
                    <option value="Gaming">Gaming</option>
                    <option value="Art">Art</option>
                    <option value="Tech">Tech</option>
                  </select>
                </div>
                <button 
                  onClick={startStreaming}
                  className="btn-primary" 
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', fontSize: '1rem', fontWeight: 'bold' }}
                >
                  Start Streaming Now
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{streamTitle}</h3>
                  <p style={{ margin: '4px 0 0', color: 'var(--accent-secondary)', fontSize: '0.9rem' }}>{category}</p>
                </div>
                <button 
                  onClick={stopStreaming}
                  style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                >
                  <StopCircle size={20} />
                  End Stream
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Streams list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {activeStreams.length > 0 ? activeStreams.map((stream) => (
          <div key={stream.id} onClick={() => router.push(`/live/${stream.id}`)} className="glass-card" style={{ borderRadius: '20px', overflow: 'hidden', cursor: 'pointer' }}>
            <div style={{ height: '240px', background: 'rgba(0,0,0,0.4)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <Play size={48} style={{ color: 'white', opacity: 0.8 }} />
                <div style={{ marginTop: '12px', fontWeight: 'bold', color: 'white' }}>Tap to Watch</div>
              </div>
              
              <div style={{ position: 'absolute', top: '16px', left: '16px', background: '#ef4444', color: 'white', fontSize: '0.75rem', fontWeight: '700', padding: '4px 12px', borderRadius: '4px' }}>
                LIVE
              </div>
              <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '0.8rem', padding: '4px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Eye size={14} /> {stream.viewer_count}
              </div>
            </div>
            
            <div style={{ padding: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', overflow: 'hidden' }}>
                {stream.profiles?.avatar_url ? <img src={stream.profiles.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : stream.profiles?.username?.[0].toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem' }}>{stream.title}</h3>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {stream.profiles?.full_name || `@${stream.profiles?.username}`} · <span style={{ color: 'var(--accent-secondary)' }}>{stream.category}</span>
                </div>
              </div>
              <button className="btn-secondary" style={{ padding: '8px 20px', borderRadius: '10px' }}>Watch</button>
            </div>
          </div>
        )) : !loading && (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
            <Radio size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
            <p>No active streams right now. Why not go live yourself?</p>
          </div>
        )}
      </div>
    </div>
  );
}
