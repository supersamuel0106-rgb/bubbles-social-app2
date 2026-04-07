import React, { useState, useEffect } from 'react';
import { Layout, Button } from '../components/UI';
import { Profile } from '../types';
import { supabase } from '../lib/supabase';
import { api, ConnectionError } from '../lib/api';
import { motion, useAnimation } from 'motion/react';
import { Send, LogOut } from 'lucide-react';

interface InteractionScreenProps {
  userId: string;
  onLogout: () => void;
}

const FloatingBubble: React.FC<{ profile: Profile; isCurrentUser: boolean }> = ({ profile, isCurrentUser }) => {
  const controls = useAnimation();

  const initialX = React.useMemo(() => Math.random() * 150 - 75, []);
  const initialY = React.useMemo(() => Math.random() * 150 - 75, []);

  useEffect(() => {
    let isActive = true;
    const animateBubble = async () => {
      // 無論如何先讓泡泡在初始座標顯現
      await controls.set({ opacity: 1, scale: 1, x: initialX, y: initialY });
      
      while (isActive) {
        await controls.start({
          x: initialX + Math.random() * 80 - 40,
          y: initialY + Math.random() * 80 - 40,
          transition: { duration: 5 + Math.random() * 5, ease: "easeInOut" }
        });
      }
    };
    animateBubble();
    return () => { isActive = false; };
  }, [controls, initialX, initialY]);

  return (
    <motion.div 
      initial={{ x: initialX, y: initialY, opacity: 0, scale: 0.5 }}
      animate={controls}
      exit={{ opacity: 0, scale: 0.5 }}
      className={`absolute flex flex-col items-center ${isCurrentUser ? 'z-30' : 'z-10'}`}
      style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
    >
      {/* Username */}
      <span className={`mb-2 font-bold text-xs uppercase tracking-tighter px-2 py-0.5 rounded-full ${isCurrentUser ? 'bg-[#007AFF] text-white' : 'bg-white/80 text-[#8E8E93] shadow-sm'}`}>
        {profile.username}
      </span>

      {/* Avatar Bubble */}
      <div className="relative">
        <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full p-1 bg-white shadow-2xl overflow-hidden flex items-center justify-center ${isCurrentUser ? 'ring-4 ring-[#007AFF]/30 border-2 border-[#007AFF]' : 'border border-white/50'}`}>
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

  useEffect(() => {
    if (userId) {
      fetchProfiles();
    }
  }, [userId]);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching all profiles...');
      const data = await api.getAllProfiles();
      console.log('Profiles data loaded:', data);
      setProfiles(data);
    } catch (err: any) {
      console.error('Failed to fetch profiles:', err);
      setError('無法載入使用者資料，請檢查後端連線。');
      if (err instanceof ConnectionError) {
        alert(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      await api.updateMessage(userId, message);
      // 更新本地狀態 (Optimistic UI)
      setProfiles(prev => prev.map(p => 
        p.id === userId ? { ...p, latest_message: message } : p
      ));
      setMessage('');
    } catch (err: any) {
      console.error('Error updating message:', err);
      if (err instanceof ConnectionError) {
        alert(err.message);
      }
    }
  };

  const logoutButton = (
    <button 
      type="button"
      onClick={() => {
        console.log('Logout button clicked');
        if (window.confirm('確定要登出嗎？')) {
          onLogout();
        }
      }}
      className="px-3 py-1.5 flex items-center gap-1.5 bg-[#FF3B30] text-white rounded-lg active:opacity-70 transition-opacity cursor-pointer relative z-[60]"
    >
      <LogOut size={16} />
      <span className="text-sm font-semibold">登出</span>
    </button>
  );

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
    <Layout 
      title="Interaction" 
      headerRight={logoutButton}
    >
      <div className="flex flex-col min-h-[calc(100vh-64px)] bg-[#F2F2F7]">
        {/* Interaction Canvas */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
          {error ? (
            <div className="flex flex-col items-center z-10">
              <p className="text-[#FF3B30] mb-4 bg-white/80 px-4 py-2 rounded-lg shadow-sm border border-[#FF3130]/20">{error}</p>
              <Button onClick={fetchProfiles} className="w-auto px-6 h-10 text-sm">重試 (Retry)</Button>
            </div>
          ) : profiles.length === 0 ? (
            <div className="flex flex-col items-center z-10">
              <p className="text-[#8E8E93] mb-4">目前沒有其他人在線上...</p>
              <Button onClick={fetchProfiles} className="w-auto px-6 h-10 text-sm">刷新 (Refresh)</Button>
            </div>
          ) : (
            <>
              {/* Debug Status Badge */}
              <div className="absolute top-6 left-6 flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-[#E5E5EA] z-[50]">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[11px] font-bold text-[#1C1C1E]">
                  互動網域已連線 ({profiles.length} 位在線)
                </span>
              </div>
              
              {/* Render all floating bubbles */}
              {profiles.map(profile => (
                <FloatingBubble 
                  key={profile.id} 
                  profile={profile} 
                  isCurrentUser={profile.id === userId} 
                />
              ))}
            </>
          )}

          {/* Ambient Background Dots */}
          <div className="absolute top-20 left-10 w-2 h-2 rounded-full bg-[#007AFF]/20 animate-pulse"></div>
          <div className="absolute bottom-40 right-10 w-3 h-3 rounded-full bg-[#5856D6]/20 animate-pulse delay-700"></div>
        </div>

        {/* Bottom Input Bar */}
        <div className="p-6 bg-white/80 backdrop-blur-xl border-t border-[#C6C6C8] pb-10 relative z-50">
          <div className="max-w-2xl mx-auto flex flex-col gap-2">
            <span className="text-xs text-[#8E8E93] font-medium tracking-wide ml-2">更新您的狀態留言</span>
            <div className="flex items-center gap-3 bg-[#F2F2F7] p-2 pl-5 rounded-full border border-[#E5E5EA] focus-within:bg-white focus-within:shadow-lg transition-all">
              <input 
                type="text" 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="說些什麼吧..."
                className="flex-grow bg-transparent border-none focus:ring-0 text-[#1C1C1E] font-medium py-2"
              />
              <button 
                onClick={handleSendMessage}
                className="bg-[#007AFF] text-white h-10 w-10 flex items-center justify-center rounded-full shadow-lg active:scale-90 transition-transform flex-shrink-0"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
