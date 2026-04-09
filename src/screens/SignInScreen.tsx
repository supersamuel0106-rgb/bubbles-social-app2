import React, { useState } from 'react';
import { Layout, Button, Input } from '../components/UI';
import { Screen } from '../types';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

interface SignInScreenProps {
  onNavigate: (screen: Screen) => void;
  onLoginSuccess: (userId: string) => void;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({ onNavigate, onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const safeIdentifier = btoa(encodeURIComponent(username)).replace(/=/g, "");
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: `${safeIdentifier.toLowerCase()}@social.app`,
        password,
      });

      if (authError) throw authError;
      if (!data.user) throw new Error('Sign in failed');

      console.log('Auth sign in success, user ID:', data.user.id);

      // NOTE: 登入成功後詢問是否記住登入
      // Supabase SDK 預設已將 session 儲存至 localStorage
      // 如果使用者拒絕，就在 sessionStorage 記錄一個標記
      // 然後 app 啟動時下次偵測到此標記就签出
      const rememberMe = window.confirm(
        '是否記住登入？\n\n選擇「確定」，下次開啟 App 將自動登入此帳號。\n選擇「取消」，將在下次關閉後自動登出。'
      );

      if (!rememberMe) {
        // NOTE: 將「拒絕記住」標記存入 localStorage，下次 App 啟動時偵測到後自動登出
        localStorage.setItem('bubbles_persist_declined', 'true');
      } else {
        localStorage.removeItem('bubbles_persist_declined');
      }

      onLoginSuccess(data.user.id);
    } catch (err: any) {
      console.error('Sign in error details:', err);
      setError(err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Welcome Back" showBack onBack={() => onNavigate('welcome')}>
      <form onSubmit={handleSignIn} className="flex flex-col px-8 pt-12 pb-12 space-y-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Sign In</h2>
          <p className="text-[#8E8E93]">Enter your details to continue.</p>
        </div>

        <div className="space-y-4">
          <Input 
            label="Username" 
            placeholder="curator_name" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Input 
            label="Password" 
            type="password" 
            placeholder="••••••••" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <p className="text-[#FF3B30] text-sm font-medium text-center bg-[#FF3B30]/10 py-3 rounded-xl">
            {error}
          </p>
        )}

        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : 'Sign In'}
        </Button>
      </form>
    </Layout>
  );
};
