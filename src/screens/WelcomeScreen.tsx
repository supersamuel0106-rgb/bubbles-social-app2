import React from 'react';
import { Layout, Button } from '../components/UI';
import { Screen } from '../types';

interface WelcomeScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNavigate }) => {
  return (
    <Layout title="Welcome">
      <div className="flex flex-col items-center justify-center h-full px-8 pb-12">
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
          <div className="space-y-4">
            <h2 className="text-5xl font-extrabold tracking-tight text-[#1C1C1E]">Bubbles</h2>
            <p className="text-[#8E8E93] text-xl font-medium">Connect through moments</p>
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
