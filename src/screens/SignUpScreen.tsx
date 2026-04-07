import React, { useState, useRef } from 'react';
import { Layout, Button, Input } from '../components/UI';
import { Screen } from '../types';
import { supabase } from '../lib/supabase';
import { api, ConnectionError } from '../lib/api';
import { Camera, Loader2 } from 'lucide-react';

interface SignUpScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({ onNavigate }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (!avatar) {
      setError('Please select an avatar');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Sign up user
      // We encode the username to Base64 to ensure it's a valid ASCII local part for the email,
      // supporting Chinese characters and other non-ASCII input.
      const safeIdentifier = btoa(encodeURIComponent(username)).replace(/=/g, "");
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: `${safeIdentifier.toLowerCase()}@social.app`, 
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Sign up failed');

      // 2. Upload avatar
      const fileExt = avatar.name.split('.').pop();
      const fileName = `${authData.user.id}-${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatar);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // 3. 透過後端 API 建立 profile
      await api.createProfile({
        id: authData.user.id,
        username,
        avatar_url: publicUrl,
      });

      onNavigate('welcome');
    } catch (err: any) {
      if (err instanceof ConnectionError) {
        setError(err.message);
      } else {
        setError(err.message || '註冊過程中發生錯誤');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Create Account" showBack onBack={() => onNavigate('welcome')}>
      <form onSubmit={handleSignUp} className="flex flex-col px-8 pt-8 pb-12 space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-32 h-32 rounded-full bg-white border-2 border-dashed border-[#C6C6C8] flex items-center justify-center overflow-hidden cursor-pointer relative group"
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <Camera size={32} className="text-[#8E8E93]" />
            )}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera size={24} className="text-white" />
            </div>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*"
          />
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-[#007AFF] font-semibold text-sm"
          >
            Pick Photo
          </button>
        </div>

        <div className="space-y-4">
          <Input 
            label="Username" 
            placeholder="Enter your username" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Input 
            label="Password" 
            type="password" 
            placeholder="Create a strong password" 
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
          {loading ? <Loader2 className="animate-spin" /> : 'Sign Up'}
        </Button>
      </form>
    </Layout>
  );
};
