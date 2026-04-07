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

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setConfigError(true);
    }
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
