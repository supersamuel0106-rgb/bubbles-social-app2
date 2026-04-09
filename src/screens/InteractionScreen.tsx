import React, { useState, useEffect } from 'react';
import { Layout, Button } from '../components/UI';
import { Profile } from '../types';
import { supabase } from '../lib/supabase';
import { api, ConnectionError } from '../lib/api';
import { motion, useMotionValue, MotionValue } from 'motion/react';
import { Send, LogOut } from 'lucide-react';

interface InteractionScreenProps {
  userId: string;
  onLogout: () => void;
}

interface FloatingBubbleProps {
  profile: Profile;
  isCurrentUser: boolean;
  registerBubble: (id: string, x: MotionValue<number>, y: MotionValue<number>, radius: number) => void;
  scaleFactor: number;
}

const FloatingBubble: React.FC<FloatingBubbleProps> = ({ profile, isCurrentUser, registerBubble, scaleFactor }) => {
  const x = useMotionValue(Math.random() * 200 - 100);
  const y = useMotionValue(Math.random() * 200 - 100);

  // NOTE: 碰撞半徑需要與視覺大小同步縮放，確保物理引擎正確
  const BASE_RADIUS = 58;
  const radius = BASE_RADIUS * scaleFactor;

  useEffect(() => {
    registerBubble(profile.id, x, y, radius);
  }, [profile.id, x, y, registerBubble, radius]);

  // 基礎泡泡大小（px）：96 對應 w-24
  const BASE_SIZE = 96;
  const bubbleSize = BASE_SIZE * scaleFactor;

  return (
    <motion.div 
      style={{ x, y, left: '50%', top: '50%', transform: 'translate(-50%, -50%)', position: 'absolute' }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      className={`flex flex-col items-center ${isCurrentUser ? 'z-30' : 'z-10'}`}
    >
      {/* NOTE: 使用者名稱標籤維持固定大小，不隨人數縮小 */}
      <span className={`mb-2 font-bold text-xs uppercase tracking-tighter px-2 py-0.5 rounded-full whitespace-nowrap ${isCurrentUser ? 'bg-[#007AFF] text-white' : 'bg-white/80 text-[#8E8E93] shadow-sm'}`}>
        {profile.username}
      </span>

      {/* Avatar Bubble — 依 scaleFactor 縮放 */}
      <div className="relative" style={{ width: bubbleSize, height: bubbleSize }}>
        <div
          style={{ width: bubbleSize, height: bubbleSize }}
          className={`rounded-full p-1 bg-white shadow-2xl overflow-hidden flex items-center justify-center ${isCurrentUser ? 'ring-4 ring-[#007AFF]/30 border-2 border-[#007AFF]' : 'border border-white/50'}`}
        >
          {profile.avatar_url ? (
            <img 
              src={profile.avatar_url} 
              alt={profile.username} 
              className="w-full h-full object-cover rounded-full"
              onError={(e) => {
                e.currentTarget.src = 'https://picsum.photos/seed/error/200';
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#007AFF] to-[#5856D6] rounded-full flex items-center justify-center text-white font-bold">
              {profile.username[0]}
            </div>
          )}
        </div>

        {/* Message Box */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          key={profile.latest_message}
          className="absolute -top-10 -right-10 bg-white py-3 px-5 rounded-3xl rounded-bl-none shadow-2xl border border-[#E5E5EA] max-w-[200px] z-40"
        >
          <p className="text-[#1C1C1E] text-base font-bold leading-tight break-words">
            {profile.latest_message || "..."}
          </p>
          <div className="absolute -bottom-2 left-0 w-4 h-4 bg-white border-l border-b border-[#E5E5EA] rotate-45 -translate-y-2"></div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export const InteractionScreen: React.FC<InteractionScreenProps> = ({ userId, onLogout }) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Physics Engine Central State ---
  const physicsState = React.useRef(new Map<string, {x: MotionValue<number>, y: MotionValue<number>, vx: number, vy: number, radius: number}>());

  const registerBubble = React.useCallback((id: string, x: MotionValue<number>, y: MotionValue<number>, radius: number) => {
    if (!physicsState.current.has(id)) {
      physicsState.current.set(id, { 
        x, y, 
        vx: (Math.random() - 0.5) * 3.5, 
        vy: (Math.random() - 0.5) * 3.5, 
        radius 
      });
    } else {
      const state = physicsState.current.get(id)!;
      state.x = x;
      state.y = y;
      state.radius = radius;
    }
  }, []);

  useEffect(() => {
    let rafId: number;
    let isActive = true;
    
    const physicsLoop = () => {
      if (!isActive) return;

      const boundaryW = (window.innerWidth / 2) - 80;
      const boundaryH = (window.innerHeight / 2) - 130;
      const bubbles = Array.from(physicsState.current.values()) as Array<{x: MotionValue<number>, y: MotionValue<number>, vx: number, vy: number, radius: number}>;

      for (const state of bubbles) {
        let cx = state.x.get();
        let cy = state.y.get();
        
        cx += state.vx;
        cy += state.vy;

        if (cx < -boundaryW) { cx = -boundaryW; state.vx *= -1; }
        if (cx > boundaryW) { cx = boundaryW; state.vx *= -1; }
        if (cy < -boundaryH) { cy = -boundaryH; state.vy *= -1; }
        if (cy > boundaryH) { cy = boundaryH; state.vy *= -1; }

        state.x.set(cx);
        state.y.set(cy);
      }

      for (let i = 0; i < bubbles.length; i++) {
        for (let j = i + 1; j < bubbles.length; j++) {
          const a = bubbles[i];
          const b = bubbles[j];
          const dx = b.x.get() - a.x.get();
          const dy = b.y.get() - a.y.get();
          const dist = Math.hypot(dx, dy);
          const minDist = a.radius + b.radius;

          if (dist < minDist && dist > 0.01) {
            const nx = dx / dist;
            const ny = dy / dist;
            const overlap = minDist - dist;
            a.x.set(a.x.get() - nx * (overlap / 2));
            a.y.set(a.y.get() - ny * (overlap / 2));
            b.x.set(b.x.get() + nx * (overlap / 2));
            b.y.set(b.y.get() + ny * (overlap / 2));

            const p = 2 * (a.vx * nx + a.vy * ny - b.vx * nx - b.vy * ny) / 2;
            a.vx -= p * nx;
            a.vy -= p * ny;
            b.vx += p * nx;
            b.vy += p * ny;

            a.vx += (Math.random() - 0.5) * 0.5;
            a.vy += (Math.random() - 0.5) * 0.5;

            const speedA = Math.hypot(a.vx, a.vy);
            if (speedA > 6.0) { a.vx *= 6.0/speedA; a.vy *= 6.0/speedA; }
            const speedB = Math.hypot(b.vx, b.vy);
            if (speedB > 6.0) { b.vx *= 6.0/speedB; b.vy *= 6.0/speedB; }
          }
        }
      }
      rafId = requestAnimationFrame(physicsLoop);
    };

    rafId = requestAnimationFrame(physicsLoop);
    return () => { isActive = false; cancelAnimationFrame(rafId); };
  }, []);

  useEffect(() => {
    if (userId) {
      fetchProfiles();
    }

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          const updatedProfile = payload.new as Profile;
          setProfiles((prev) => 
            prev.map((p) => (p.id === updatedProfile.id ? updatedProfile : p))
          );
        }
      )
      .subscribe();

    const pollingInterval = setInterval(() => {
      silentFetchProfiles();
    }, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollingInterval);
    };
  }, [userId]);

  const silentFetchProfiles = async () => {
    try {
      const data = await api.getAllProfiles();
      setProfiles(data);
    } catch (err) {
      console.error('Silent fetch failed:', err);
    }
  };

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAllProfiles();
      setProfiles(data);
    } catch (err: any) {
      console.error('Failed to fetch profiles:', err);
      setError('無法載入使用者資料，請檢查後端連線。');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchProfiles();
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    try {
      await api.updateMessage(userId, message);
      setProfiles(prev => prev.map(p => 
        p.id === userId ? { ...p, latest_message: message } : p
      ));
      setMessage('');
    } catch (err: any) {
      console.error('Error updating message:', err);
    }
  };

  const logoutButton = (
    <button 
      type="button"
      onClick={() => window.confirm('確定要登出嗎？') && onLogout()}
      className="px-3 py-1.5 flex items-center gap-1.5 bg-[#FF3B30] text-white rounded-lg active:opacity-70 z-[60]"
    >
      <LogOut size={16} />
      <span className="text-sm font-semibold">登出</span>
    </button>
  );

  /**
   * NOTE: 線性縮放公式
   * 人數 <= 4：scaleFactor = 1.0（原始大小）
   * 人數 >= 20：scaleFactor = 0.25（縮小至 1/4）
   * 中間值：線性插值
   */
  const MIN_COUNT = 4;
  const MAX_COUNT = 20;
  const MIN_SCALE = 0.25;
  const MAX_SCALE = 1.0;
  const clampedCount = Math.max(MIN_COUNT, Math.min(profiles.length, MAX_COUNT));
  const scaleFactor = MAX_SCALE - (MAX_SCALE - MIN_SCALE) * ((clampedCount - MIN_COUNT) / (MAX_COUNT - MIN_COUNT));

  if (loading && profiles.length === 0) {
    return (
      <Layout title="Interaction" headerRight={logoutButton}>
        <div className="flex items-center justify-center h-full">
          <div className="w-8 h-8 border-4 border-[#007AFF] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Interaction" headerRight={logoutButton} onRefresh={handleRefresh}>
      <div className="flex flex-col min-h-[calc(100vh-64px)] bg-[#F2F2F7]">
        <div className="flex-1 relative flex items-center justify-center overflow-hidden touch-none">

          {error ? (
            <div className="flex flex-col items-center z-10">
              <p className="text-[#FF3B30] mb-4 bg-white/80 px-4 py-2 rounded-lg">{error}</p>
              <Button onClick={fetchProfiles} className="w-auto px-6 h-10 text-sm">重試</Button>
            </div>
          ) : profiles.length === 0 ? (
            <div className="flex flex-col items-center z-10">
              <p className="text-[#8E8E93] mb-4">目前沒有其他人在線上...</p>
              <Button onClick={fetchProfiles} className="w-auto px-6 h-10 text-sm">刷新</Button>
            </div>
          ) : (
            <>
              <div className="absolute top-6 left-6 flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-[#E5E5EA] z-[50]">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[11px] font-bold text-[#1C1C1E]">互動網域已連線 ({profiles.length} 位)</span>
              </div>
              
              {profiles.map(profile => (
                <FloatingBubble 
                  key={profile.id} 
                  profile={profile} 
                  isCurrentUser={profile.id === userId}
                  registerBubble={registerBubble}
                  scaleFactor={scaleFactor}
                />
              ))}
            </>
          )}

          <div className="absolute top-20 left-10 w-2 h-2 rounded-full bg-[#007AFF]/20 animate-pulse"></div>
          <div className="absolute bottom-40 right-10 w-3 h-3 rounded-full bg-[#5856D6]/20 animate-pulse delay-700"></div>
        </div>

        <div className="p-6 bg-white/80 backdrop-blur-xl border-t border-[#C6C6C8] pb-10 relative z-50">
          <div className="max-w-2xl mx-auto flex flex-col gap-2">
            <span className="text-xs text-[#8E8E93] font-medium ml-2">更新您的狀態留言</span>
            <div className="flex items-center gap-3 bg-[#F2F2F7] p-2 pl-5 rounded-full border border-[#E5E5EA] focus-within:bg-white transition-all">
              <input 
                type="text" 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="說些什麼吧..."
                className="flex-grow bg-transparent border-none focus:ring-0 text-[#1C1C1E] font-medium py-2"
              />
              <button onClick={handleSendMessage} className="bg-[#007AFF] text-white h-10 w-10 flex items-center justify-center rounded-full active:scale-90 transition-transform">
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
