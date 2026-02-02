import React, { useEffect, useState } from 'react';
import { Trophy, Star, Sparkles, ArrowRight, Zap } from 'lucide-react';
import { LEVEL_SYSTEM } from '../constants';

interface LevelUpModalProps {
  newLevel: number;
  onClose: () => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ newLevel, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Trigger animation after mount
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const levelConfig = LEVEL_SYSTEM.find(l => l.level === newLevel) || LEVEL_SYSTEM[LEVEL_SYSTEM.length - 1];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      {/* Backdrop with blur */}
      <div 
        className={`absolute inset-0 bg-black/90 backdrop-blur-xl transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Main Card */}
      <div className={`relative w-full max-w-sm bg-neutral-900 border-2 border-neutral-800 rounded-2xl p-8 flex flex-col items-center text-center transform transition-all duration-700 ${isVisible ? 'scale-100 translate-y-0 opacity-100' : 'scale-75 translate-y-10 opacity-0'}`}>
        
        {/* Confetti / Glow effects */}
        <div className="absolute -top-20 inset-x-0 flex justify-center">
           <div className={`relative w-40 h-40 bg-gradient-to-t from-${levelConfig.color.split('-')[1]}-500/20 to-transparent rounded-full blur-3xl animate-pulse`}></div>
        </div>

        {/* Icon */}
        <div className="relative mb-6">
           <div className={`w-24 h-24 rounded-full border-4 ${levelConfig.border.replace('/50','')} flex items-center justify-center bg-black shadow-[0_0_30px_rgba(0,0,0,0.5)]`}>
              <Trophy size={48} className={levelConfig.color} />
           </div>
           <div className="absolute -bottom-2 -right-2 bg-white text-black font-black text-lg w-10 h-10 rounded-full flex items-center justify-center border-4 border-neutral-900">
             {newLevel}
           </div>
           
           {/* Floating Stars */}
           <Star className="absolute top-0 -left-6 text-yellow-400 animate-bounce" size={24} fill="currentColor" style={{ animationDelay: '0.1s' }} />
           <Star className="absolute bottom-0 -right-6 text-yellow-400 animate-bounce" size={16} fill="currentColor" style={{ animationDelay: '0.3s' }} />
           <Sparkles className="absolute -top-4 right-0 text-white animate-pulse" size={20} />
        </div>

        {/* Text */}
        <h2 className="text-3xl font-black text-white uppercase tracking-wider mb-2 italic transform -skew-x-6">
          Level Up!
        </h2>
        <p className="text-neutral-400 font-medium mb-8">
          You are now a <span className={`${levelConfig.color} font-bold`}>{levelConfig.title}</span>.
        </p>

        {/* Rewards (Mock) */}
        <div className="w-full bg-neutral-950 rounded-xl p-4 mb-8 border border-neutral-800/50">
           <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-neutral-500 font-bold uppercase text-[10px] tracking-widest">Rewards Unlocked</span>
           </div>
           <div className="flex items-center gap-3 text-left">
              <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center text-blue-400">
                 <Zap size={16} fill="currentColor" />
              </div>
              <div>
                 <p className="text-white font-bold text-sm">Max Streak Freeze</p>
                 <p className="text-neutral-600 text-xs">Keep your streak alive for 24h.</p>
              </div>
           </div>
        </div>

        {/* Button */}
        <button 
          onClick={onClose}
          className="w-full bg-white text-black font-black uppercase tracking-widest py-4 rounded-xl hover:scale-105 transition-transform shadow-[0_4px_0_rgb(150,150,150)] active:shadow-none active:translate-y-[4px] flex items-center justify-center gap-2"
        >
          Continue <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};