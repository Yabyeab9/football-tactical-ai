import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Zap, Target, TrendingUp } from 'lucide-react';

interface DashboardHeroProps {
  overviewCards: Array<{
    label: string;
    value: number | string;
    tone: string;
  }>;
}

export const DashboardHero: React.FC<DashboardHeroProps> = ({ overviewCards }) => {
  return (
    <div className="relative overflow-hidden rounded-[2.5rem] bg-[#05070A] border border-white/5 p-6 md:p-10 mb-8">
      {/* Subtle Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[40%] h-[100%] bg-primary/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary">Neural Link: Active</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none mb-4">
            Intelligence <span className="text-white/40">OS</span>
          </h1>
          
          <p className="text-sm text-white/40 font-medium leading-relaxed max-w-md">
            Real-time tactical modeling across 14 elite competitions. Decoding match momentum and winning patterns through neural inference.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-auto">
          {overviewCards.map((card, idx) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-4 min-w-[140px]"
            >
              <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">{card.label}</div>
              <div className={`text-2xl font-black tabular-nums ${
                card.tone === 'highlight' ? 'text-primary' : 
                card.tone === 'warning' ? 'text-amber-400' : 'text-white'
              }`}>
                {card.value}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
