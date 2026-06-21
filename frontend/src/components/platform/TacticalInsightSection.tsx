import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, TrendingUp, Target, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TacticalInsightSectionProps {
  spotlight: any;
  loading: boolean;
}

export const TacticalInsightSection: React.FC<TacticalInsightSectionProps> = ({ spotlight, loading }) => {
  if (loading) {
    return <div className="h-96 rounded-[3rem] bg-white/5 animate-pulse" />;
  }

  const analysis = spotlight?.analysis;
  const intelligence = spotlight?.intelligence || spotlight; // Fallback if data structure varies

  return (
    <div className="grid lg:grid-cols-[1fr_400px] gap-8 mt-12">
      <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-[#0A0C10] to-[#12161D] border border-white/5 p-8 md:p-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
               <BrainCircuit className="h-5 w-5 text-primary" />
             </div>
             <div>
               <h2 className="text-2xl font-black text-white">Tactical Spotlight</h2>
               <p className="text-sm text-white/40 font-medium">Neural match modelling & live narrative</p>
             </div>
          </div>
          <Badge className="bg-primary/20 text-primary border-0 rounded-lg px-3 py-1">Deep Intelligence</Badge>
        </div>

        {spotlight ? (
          <div className="space-y-8">
            {/* Tactical Narrative Hero */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 rounded-[2rem] p-6 mb-8 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity">
                 <Zap className="h-4 w-4 text-primary" />
              </div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-3">Live Tactical Narrative</div>
              <p className="text-lg font-bold text-white leading-relaxed italic">
                "{intelligence?.narrative || 'Analyzing match flow... Intelligence engine warming up.'}"
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/30">
                  <TrendingUp className="h-3 w-3 text-blue-400" />
                  Momentum Analysis
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${analysis?.momentum?.home || 50}%` }}
                    className="h-full bg-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]" 
                  />
                  <div className="h-full bg-white/10 flex-1" />
                </div>
                <div className="flex justify-between text-xs font-bold text-white/60">
                  <span>{spotlight.match?.home_team?.name || 'Home Team'}</span>
                  <span>{analysis?.momentum?.label || 'Neutral'}</span>
                  <span>{spotlight.match?.away_team?.name || 'Away Team'}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/30">
                  <Target className="h-3 w-3 text-amber-400" />
                  Win Probability
                </div>
                <div className="grid grid-cols-3 gap-2">
                   {[
                     { label: 'HOME', val: analysis?.prediction?.home_win || 0, color: 'bg-primary' },
                     { label: 'DRAW', val: analysis?.prediction?.draw || 0, color: 'bg-white/10' },
                     { label: 'AWAY', val: analysis?.prediction?.away_win || 0, color: 'bg-blue-500' },
                   ].map((item) => (
                     <div key={item.label} className="bg-white/5 rounded-2xl p-3 text-center border border-white/5">
                        <div className="text-xl font-black text-white">{item.val}%</div>
                        <div className="text-[8px] font-bold text-white/30 uppercase tracking-widest mt-1">{item.label}</div>
                     </div>
                   ))}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
               <div className="bg-white/5 border border-white/5 rounded-[2rem] p-6">
                  <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-4">Tactical Strengths</div>
                  <ul className="space-y-3">
                     {(analysis?.strengths || ['High pressing intensity', 'Fluid wing rotations']).map((s: string) => (
                       <li key={s} className="flex items-start gap-3 text-sm font-semibold text-white/80 leading-snug">
                          <Zap className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          {s}
                       </li>
                     ))}
                  </ul>
               </div>
               <div className="bg-white/5 border border-white/5 rounded-[2rem] p-6">
                  <div className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-4">Structural Vulnerabilities</div>
                  <ul className="space-y-3">
                     {(analysis?.weaknesses || ['Space behind full-backs', 'Slow transition recovery']).map((w: string) => (
                       <li key={w} className="flex items-start gap-3 text-sm font-semibold text-white/80 leading-snug">
                          <div className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                          {w}
                       </li>
                     ))}
                  </ul>
               </div>
            </div>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-center opacity-20">
             <BrainCircuit className="h-16 w-16 mb-4" />
             <div className="text-lg font-black uppercase tracking-[0.3em]">No Active Modelling</div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6">
         <Card className="rounded-[2.5rem] bg-[#0A0C10] border-white/5 overflow-hidden">
            <CardHeader className="bg-white/5 border-b border-white/5">
               <CardTitle className="text-sm font-black uppercase tracking-widest text-white/60">System Insights</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
               {[
                 "Model predicting high-scoring second half",
                 "Home team XG trend rising (+0.4 last 15')",
                 "Opposition pressing drop detected"
               ].map((insight, i) => (
                 <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 group">
                    <div className="h-2 w-2 rounded-full bg-primary mt-1.5 group-hover:scale-125 transition-transform" />
                    <p className="text-xs font-bold text-white/70 leading-relaxed">{insight}</p>
                 </div>
               ))}
            </CardContent>
         </Card>

         <div className="flex-1 rounded-[2.5rem] bg-primary/10 border border-primary/20 p-8 flex flex-col items-center justify-center text-center group">
            <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center mb-6 shadow-2xl shadow-primary/40 group-hover:scale-110 transition-transform">
               <BrainCircuit className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">Ask Tactical AI</h3>
            <p className="text-sm text-white/40 font-medium mb-6">In-depth analysis of any match, player or tactical trend.</p>
            <button className="w-full py-4 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-[10px] hover:bg-primary hover:text-white transition-all">
               Start Consultation
            </button>
         </div>
      </div>
    </div>
  );
};
