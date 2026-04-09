import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Loader2 } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  onBack?: () => void;
  showBack?: boolean;
  headerRight?: React.ReactNode;
  onRefresh?: () => Promise<void>;
  hideHeader?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, title, onBack, showBack, headerRight, onRefresh, hideHeader }) => {
  const [pullProgress, setPullProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (mainRef.current?.scrollTop === 0 && onRefresh && !isRefreshing) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startY.current;
    
    if (deltaY > 0 && mainRef.current?.scrollTop === 0) {
      // Add resistance
      const progress = Math.min(deltaY / 2.5, 100);
      setPullProgress(progress);
      
      // Prevent native scrolling when pulling down at the top
      if (e.cancelable) e.preventDefault();
    } else if (deltaY < 0) {
      setIsPulling(false);
      setPullProgress(0);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling || isRefreshing) return;
    
    if (pullProgress > 60) {
      setIsRefreshing(true);
      setPullProgress(60); // Keep indicator visible while refreshing
      try {
        await onRefresh?.();
      } finally {
        setIsRefreshing(false);
        setPullProgress(0);
        setIsPulling(false);
      }
    } else {
      setPullProgress(0);
      setIsPulling(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] text-[#1C1C1E] font-sans flex flex-col overflow-hidden select-none">
      {/* iOS-style Header */}
      {!hideHeader && (
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
      )}

      <main 
        ref={mainRef}
        className="flex-1 overflow-y-auto relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Pull-to-Refresh Indicator */}
        {onRefresh && (
          <motion.div 
            style={{ 
              height: pullProgress,
              opacity: pullProgress / 60,
              y: -pullProgress,
            }}
            animate={{ 
              y: 0,
              height: isRefreshing ? 60 : pullProgress 
            }}
            className="absolute top-0 left-0 right-0 flex items-center justify-center overflow-hidden z-40 pointer-events-none"
          >
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md shadow-sm border border-[#E5E5EA] transition-all ${pullProgress > 60 ? 'scale-110' : 'scale-100'}`}>
              <motion.div
                animate={isRefreshing ? { rotate: 360 } : { rotate: pullProgress * 5 }}
                transition={isRefreshing ? { repeat: Infinity, duration: 1, ease: "linear" } : { type: "spring", stiffness: 200 }}
              >
                <Loader2 size={16} className="text-[#007AFF]" />
              </motion.div>
              <span className="text-[11px] font-bold text-[#1C1C1E]">
                {isRefreshing ? '正在更新...' : pullProgress > 60 ? '放開即可更新' : '下拉更新'}
              </span>
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ 
              opacity: 1, 
              y: isRefreshing ? 60 : (pullProgress > 0 ? pullProgress : 0) 
            }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ 
              y: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
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
