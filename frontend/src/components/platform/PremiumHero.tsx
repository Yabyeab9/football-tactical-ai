import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BrainCircuit, Activity, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export const PremiumHero: React.FC = () => {
  return (
    <div className="relative overflow-hidden rounded-[3rem] bg-[#05070A] border border-white/5 p-8 md:p-16 mb-12">
      {/* Background Animated Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-500/5 blur-[100px] rounded-full" />
        
        {/* Tactical Lines Overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0 50 Q 25 25, 50 50 T 100 50" stroke="white" fill="transparent" strokeWidth="0.1" />
          <path d="M0 20 Q 30 40, 60 20 T 100 20" stroke="white" fill="transparent" strokeWidth="0.1" />
          <circle cx="50" cy="50" r="20" stroke="white" fill="transparent" strokeWidth="0.1" />
        </svg>
      </div>

      <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-ping" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">System Online: Live Intelligence</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-[1.1] mb-6">
            Elite Football <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-primary/80">
              Tactical AI
            </span>
          </h1>
          
          <p className="text-lg text-white/50 mb-10 max-w-lg leading-relaxed font-medium">
            Harnessing real-time event streams and proprietary AI models to decode match momentum, tactical shifts, and winning patterns.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg" className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white border-0 shadow-2xl shadow-primary/20 group">
              <Link to="/matches">
                Launch Live Center
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-14 px-8 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10">
              <Link to="/tactical-lab">Tactical Lab</Link>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative hidden lg:block"
        >
          <div className="relative aspect-square max-w-[500px] mx-auto">
            {/* Central Animated Logo/Shield */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 rounded-full bg-primary/20 border border-primary/50 animate-pulse blur-xl" />
              <div className="relative w-48 h-48 rounded-full border border-white/10 flex items-center justify-center bg-[#0A0C10] shadow-2xl overflow-hidden">
                 <BrainCircuit className="h-24 w-24 text-primary animate-pulse" />
                 <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
              </div>
            </div>

            {/* Orbiting Elements */}
            {[
              { icon: Activity, label: "Momentum", color: "text-blue-400", delay: 0 },
              { icon: Shield, label: "Defensive", color: "text-emerald-400", delay: 2 },
              { icon: Target, label: "Precision", color: "text-amber-400", delay: 4 },
            ].map((item, idx) => (
              <motion.div
                key={item.label}
                animate={{
                  rotate: 360,
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear",
                  delay: item.delay
                }}
                className="absolute inset-0"
              >
                <div 
                  className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 px-5 py-3 rounded-2xl"
                  style={{ transform: `rotate(-${idx * 120}deg)` }}
                >
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                  <span className="text-xs font-black uppercase tracking-widest text-white">{item.label}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const Target = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);
