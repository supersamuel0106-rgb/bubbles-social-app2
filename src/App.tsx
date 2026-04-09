import { useState, useEffect } from 'react';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { SignUpScreen } from './screens/SignUpScreen';
import { SignInScreen } from './screens/SignInScreen';
import { InteractionScreen } from './screens/InteractionScreen';
import { Screen } from './types';
import { supabase, isSupabaseConfigured } from './lib/supabase';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [userId, setUserId] = useState<string | null>(null);
  const [configError, setConfigError] = useState(false);
  // NOTE: 啟動時先顯示加載畫面，偵測是否有已記住的 Session
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setConfigError(true);
      setIsInitializing(false);
      return;
    }

    // 偵測是否有已存在的 Supabase Session（登入已記住）
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        // NOTE: 若使用者上次選擇「不記住登入」，sessionStorage 中會有標記
        // sessionStorage 只在同一瀏覽器分頁中存活
        // 當使用者關閉分頁後重新開啟，sessionStorage 會被清除
        // 此時 no_persist 為 null，代表是全新啟動。需要判斷是否應自動登入：
        // - 有 no_persist = 'true'：使用者主動選了「不記住」，但這只在同一分頁有效 → 繼續登入
        // - 沒有 no_persist：可能是選了記住(直接恢復)，或是選了不記住但已重開分頁
        //   → 無法區分，採用保守策略：檢查 localStorage 中是否有明確的拒絕標記
        const persistDeclined = localStorage.getItem('bubbles_persist_declined');
        if (persistDeclined === 'true') {
          // 使用者上次明確拒絕記住登入 → 清除 session，回到歡迎頁
          await supabase.auth.signOut();
          localStorage.removeItem('bubbles_persist_declined');
        } else {
          // 使用者選擇了記住登入，或是首次登入尚未選擇 → 恢復 session
          setUserId(session.user.id);
          setCurrentScreen('interaction');
        }
      }
      setIsInitializing(false);
    });
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUserId(null);
      setCurrentScreen('welcome');
    }
  };

  if (configError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-center bg-[#F2F2F7]">
        <div className="bg-white p-8 rounded-3xl shadow-xl space-y-4 max-w-sm">
          <h2 className="text-2xl font-bold text-[#FF3B30]">Configuration Required</h2>
          <p className="text-[#8E8E93]">
            Please set your Supabase URL and Anon Key in the environment variables to continue.
          </p>
          <div className="text-left bg-[#F2F2F7] p-4 rounded-xl text-xs font-mono break-all">
            VITE_SUPABASE_URL<br/>
            VITE_SUPABASE_ANON_KEY
          </div>
        </div>
      </div>
    );
  }

  const handleLoginSuccess = (id: string) => {
    console.log('Login success handler called with ID:', id);
    setUserId(id);
    setCurrentScreen('interaction');
  };

  // 啟動時等待 Session 偵測完成
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2F2F7]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#8E8E93] text-sm font-medium">正在初始化...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {currentScreen === 'welcome' && (
        <WelcomeScreen onNavigate={setCurrentScreen} />
      )}
      {currentScreen === 'signup' && (
        <SignUpScreen onNavigate={setCurrentScreen} />
      )}
      {currentScreen === 'signin' && (
        <SignInScreen 
          onNavigate={setCurrentScreen} 
          onLoginSuccess={handleLoginSuccess} 
        />
      )}
      {currentScreen === 'interaction' && (
        userId ? (
          <InteractionScreen userId={userId} onLogout={handleLogout} />
        ) : (
          <div className="flex items-center justify-center min-h-screen">
            <p>正在初始化使用者 session...</p>
          </div>
        )
      )}
    </>
  );
}
