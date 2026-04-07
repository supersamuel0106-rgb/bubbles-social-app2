import React from 'react';
import { Layout, Button } from '../components/UI';
import { Screen } from '../types';
import { Sparkles } from 'lucide-react';

interface WelcomeScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNavigate }) => {
  return (
    <Layout title="Welcome">
      <div className="flex flex-col items-center justify-center h-full px-8 pb-12">
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-24 h-24 bg-gradient-to-br from-[#007AFF] to-[#5856D6] rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-[#007AFF]/30">
            <Sparkles size={48} />
          </div>
          <div className="space-y-2">
            <h2 className="text-4xl font-extrabold tracking-tight text-[#1C1C1E]">Atelier</h2>
            <p className="text-[#8E8E93] text-lg font-medium">Connect through moments</p>
          </div>
        </div>

        <div className="w-full space-y-4">
          <Button onClick={() => onNavigate('signup')}>
            Sign Up
          </Button>
          <Button variant="secondary" onClick={() => onNavigate('signin')}>
            Sign In
          </Button>
        </div>
      </div>
    </Layout>
  );
};
