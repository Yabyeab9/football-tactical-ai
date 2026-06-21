import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Zap, Trophy, Timer, Calendar, Activity, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { LiveMatch } from '@/db/api';
import { format, formatDistanceToNow, isAfter, isBefore, addHours } from 'date-fns';

interface LiveMatchCenterProps {
  matches: LiveMatch[];
  loading: boolean;
}

type MatchState = 'LIVE' | 'UPCOMING' | 'RECENT' | 'EMPTY';

export const LiveMatchCenter: React.FC<LiveMatchCenterProps> = ({ matches, loading }) => {
  const matchState = useMemo<MatchState>(() => {
    if (!matches || matches.length === 0) return 'EMPTY';
    
    const hasLive = matches.some(m => ['LIVE', 'IN_PLAY', 'PAUSED', 'HALF_TIME'].includes(m.status.toUpperCase()));
    if (hasLive) return 'LIVE';
    
    const now = new Date();
    const allUpcoming = matches.every(m => isAfter(new Date(m.kickoff), now));
    if (allUpcoming) return 'UPCOMING';
    
    return 'RECENT';
  }, [matches]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl bg-white/5" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48 bg-white/5" />
              <Skeleton className="h-4 w-32 bg-white/5" />
            </div>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-[2rem] bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  if (matchState === 'EMPTY') {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[2.5rem] bg-[#0A0C10] border border-white/5 p-12 text-center relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
            <Calendar className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-3xl font-black text-white mb-2">No Live Football Activity</h2>
          <p className="text-white/40 max-w-md mx-auto font-medium">
            Our systems are monitoring all supported competitions. No matches currently meet the elite intelligence criteria.
          </p>
          <div className="mt-8 flex gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold text-white/60 uppercase tracking-widest">System Status: Active</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
              <Info className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Next Refresh: 60s</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center relative">
            {matchState === 'LIVE' ? (
              <>
                <Radio className="h-5 w-5 text-primary relative z-10" />
                <span className="absolute inset-0 rounded-xl bg-primary/20 animate-ping" />
              </>
            ) : matchState === 'UPCOMING' ? (
              <Calendar className="h-5 w-5 text-primary" />
            ) : (
              <Timer className="h-5 w-5 text-primary" />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">
              {matchState === 'LIVE' ? 'Live Match Center' : 
               matchState === 'UPCOMING' ? 'Upcoming Fixtures' : 'Recently Completed'}
            </h2>
            <p className="text-sm text-white/40 font-medium">
              {matchState === 'LIVE' ? 'Real-time elite tactical coverage' : 
               matchState === 'UPCOMING' ? 'Smart prioritized upcoming matches' : 'Last 48 hours of tactical data'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {matchState === 'LIVE' && (
            <Badge className="bg-red-500/20 text-red-500 border-0 font-black animate-pulse">
              {matches.length} ACTIVE
            </Badge>
          )}
          <Badge className="bg-white/5 text-white/60 border-white/10 hover:bg-white/10 cursor-default">
            {matchState === 'UPCOMING' ? 'Next 72h' : matchState === 'RECENT' ? 'Past 48h' : 'Elite Only'}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {matches.map((match, idx) => (
            <motion.div
              key={match.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 30,
                delay: idx * 0.05 
              }}
            >
              <Card className="group relative overflow-hidden rounded-[2.5rem] bg-[#0A0C10] border-white/5 hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 cursor-pointer">
                {/* Visual accents */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
                {matchState === 'LIVE' && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent opacity-50" />
                )}

                <CardContent className="p-7">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2.5">
                       {match.competition.code === 'CL' ? (
                         <Trophy className="h-3.5 w-3.5 text-amber-400" />
                       ) : (
                         <div className={`h-2 w-2 rounded-full ${matchState === 'LIVE' ? 'bg-red-500 animate-pulse' : 'bg-primary'}`} />
                       )}
                       <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                         {match.competition.name}
                       </span>
                    </div>
                    
                    <MatchStatusBadge match={match} state={matchState} />
                  </div>

                  <div className="flex items-center justify-between gap-6 mb-8">
                    <TeamDisplay team={match.homeTeamRef} isHome />

                    <div className="flex flex-col items-center">
                      <div className="text-4xl font-black text-white tracking-tighter tabular-nums flex items-center gap-2">
                        <span>{match.score.home}</span>
                        <span className="text-white/20">:</span>
                        <span>{match.score.away}</span>
                      </div>
                      
                      <div className="mt-3 flex flex-col items-center gap-1">
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                          <Zap className="h-3 w-3 text-primary" />
                          <span className="text-[8px] font-black text-primary uppercase tracking-widest">Intelligence Live</span>
                        </div>
                        {matchState === 'UPCOMING' && (
                          <span className="text-[9px] font-bold text-white/30 uppercase tracking-tighter">
                            {format(new Date(match.kickoff), 'EEE, HH:mm')}
                          </span>
                        )}
                      </div>
                    </div>

                    <TeamDisplay team={match.awayTeamRef} isHome={false} />
                  </div>

                  <div className="pt-5 border-t border-white/5 flex items-center justify-between">
                     <div className="flex -space-x-2">
                        {match.providers.map((p) => (
                          <div key={p} className="h-7 w-7 rounded-full bg-[#0A0C10] border border-white/10 flex items-center justify-center group-hover:border-primary/30 transition-colors">
                             <span className="text-[9px] font-black text-white/40 uppercase">{p[0]}</span>
                          </div>
                        ))}
                     </div>
                     <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest flex items-center gap-1.5">
                       <div className="h-1 w-1 rounded-full bg-white/20" />
                       {match.venue || 'Modern Arena'}
                     </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

const TeamDisplay = ({ team, isHome }: { team: any, isHome: boolean }) => (
  <div className="flex-1 text-center group/team">
    <div className="h-16 w-16 mx-auto rounded-[1.5rem] bg-white/5 flex items-center justify-center mb-4 group-hover:bg-white/10 transition-all duration-500 group-hover:scale-110 border border-white/5 group-hover:border-white/10">
      {team.crest ? (
        <img src={team.crest} alt={team.name} className="h-11 w-11 object-contain drop-shadow-2xl" />
      ) : (
        <span className="text-2xl font-black text-white/20">{team.name[0]}</span>
      )}
    </div>
    <div className="text-xs font-black text-white uppercase tracking-wider truncate max-w-[90px] mx-auto group-hover/team:text-primary transition-colors">
      {team.shortName || team.name}
    </div>
  </div>
);

const MatchStatusBadge = ({ match, state }: { match: LiveMatch, state: MatchState }) => {
  if (state === 'LIVE') {
    return (
      <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-[0.1em]">{match.minute}'</span>
      </div>
    );
  }

  if (state === 'UPCOMING') {
    const distance = formatDistanceToNow(new Date(match.kickoff), { addSuffix: true });
    return (
      <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/5 text-white/40 border border-white/10 group-hover:border-primary/30 group-hover:text-primary transition-colors">
        <Timer className="h-3 w-3" />
        <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">{distance}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/5 text-white/40 border border-white/10">
      <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">Full Time</span>
    </div>
  );
};
