import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  onBack?: () => void;
  showBack?: boolean;
  headerRight?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children, title, onBack, showBack, headerRight }) => {
  return (
    <div className="min-h-screen bg-[#F2F2F7] text-[#1C1C1E] font-sans flex flex-col overflow-hidden">
      {/* iOS-style Header */}
      <header className="h-16 flex items-center px-4 bg-white/80 backdrop-blur-md border-b border-[#C6C6C8] sticky top-0 z-50">
        <div className="flex-1 flex justify-start">
          {showBack && (
            <button 
              onClick={onBack}
              className="p-2 -ml-2 text-[#007AFF] active:opacity-30 transition-opacity"
            >
              <ChevronLeft size={28} />
            </button>
          )}
        </div>
        <h1 className="text-lg font-semibold tracking-tight shrink-0">{title || 'Bubbles'}</h1>
        <div className="flex-1 flex justify-end">
          {headerRight}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto relative">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' }> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}) => {
  const baseStyles = "w-full h-14 rounded-2xl font-semibold text-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-[#007AFF] text-white shadow-lg shadow-[#007AFF]/20",
    secondary: "bg-white text-[#007AFF] border border-[#E5E5EA]"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => {
  return (
    <div className="space-y-1.5 w-full">
      <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider ml-1">
        {label}
      </label>
      <input
        className="w-full h-14 px-4 bg-white border border-[#E5E5EA] rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 focus:border-[#007AFF] outline-none transition-all text-lg"
        {...props}
      />
    </div>
  );
};
