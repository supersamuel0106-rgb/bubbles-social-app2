import React from 'react';
import { Layout, Button } from '../components/UI';
import { Screen } from '../types';

interface WelcomeScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNavigate }) => {
  return (
    <Layout 
      hideHeader
      onRefresh={async () => {
        await new Promise(resolve => setTimeout(resolve, 1500));
        console.log('WelcomeScreen refreshed');
      }}
    >
      <div className="flex flex-col items-center justify-center h-full px-8 space-y-12">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <h2 className="text-6xl font-extrabold tracking-tight text-[#1C1C1E]">Bubbles</h2>
          <p className="text-[#8E8E93] text-xl font-medium">Connect through moments</p>
        </div>

        <div className="w-full space-y-4 max-w-sm">
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
