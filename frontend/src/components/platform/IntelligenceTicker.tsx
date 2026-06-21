import React from 'react';
import { motion } from 'framer-motion';
import { Zap, TrendingUp, AlertCircle, Activity } from 'lucide-react';

interface TickerItem {
  id: string;
  type: 'MOMENTUM' | 'GOAL' | 'TACTICAL' | 'ALERT';
  message: string;
  time: string;
}

interface IntelligenceTickerProps {
  items: TickerItem[];
}

export const IntelligenceTicker: React.FC<IntelligenceTickerProps> = ({ items }) => {
  // If no items, show default system messages
  const displayItems = items.length > 0 ? items : [
    { id: '1', type: 'TACTICAL', message: 'Neural engine monitoring 14 active elite competitions', time: 'NOW' },
    { id: '2', type: 'MOMENTUM', message: 'Analyzing live momentum streams for Premier League fixtures', time: 'NOW' },
    { id: '3', type: 'ALERT', message: 'System Integrity: Optimal - All data providers responding < 200ms', time: 'NOW' }
  ];

  return (
    <div className="w-full bg-[#05070A] border-y border-white/5 py-3 overflow-hidden whitespace-nowrap relative">
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#05070A] to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#05070A] to-transparent z-10" />
      
      <motion.div 
        animate={{ x: [0, -1000] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        className="inline-flex gap-12 items-center"
      >
        {/* Repeat items to ensure smooth infinite loop */}
        {[...displayItems, ...displayItems, ...displayItems].map((item, idx) => (
          <div key={`${item.id}-${idx}`} className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${
              item.type === 'MOMENTUM' ? 'bg-blue-500/20 text-blue-400' :
              item.type === 'GOAL' ? 'bg-primary/20 text-primary' :
              item.type === 'ALERT' ? 'bg-amber-500/20 text-amber-400' :
              'bg-white/10 text-white/60'
            }`}>
              {item.type === 'MOMENTUM' && <TrendingUp className="h-2.5 w-2.5" />}
              {item.type === 'GOAL' && <Zap className="h-2.5 w-2.5" />}
              {item.type === 'ALERT' && <AlertCircle className="h-2.5 w-2.5" />}
              {item.type === 'TACTICAL' && <Activity className="h-2.5 w-2.5" />}
              {item.type}
            </div>
            <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider">
              {item.message}
            </span>
            <span className="text-[9px] font-black text-white/10">{item.time}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};
