import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Calendar, MapPin, Users, Trophy, Clock, Shirt, Target,
  Activity, Crosshair, Flame, Zap, Shield, GitCommit, Brain,
  MessageSquare, Send, ChevronRight, BarChart3, Info, TrendingUp,
  MousePointer2, Search, Download, Share2
} from 'lucide-react';

import { MainLayout } from '@/components/layouts/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

import type { Match, TacticalMetric, PlayerStats } from '@/types';
import { getMatchById, getTacticalMetricsByMatch, getPlayerStatsByMatch } from '@/db/api';

// --- STYLED SUB-COMPONENTS ---

const ModernStatCard = ({ label, value, subValue, icon: Icon, trend }: any) => (
  <Card className="bg-card/40 border-border/40 backdrop-blur-md overflow-hidden relative group">
    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
      <Icon className="h-12 w-12" />
    </div>
    <CardContent className="p-4">
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
        <Icon className="h-3 w-3" /> {label}
      </p>
      <div className="mt-2 flex items-baseline gap-2">
        <h3 className="text-2xl font-black font-mono tracking-tighter">{value}</h3>
        {trend && (
          <span className={`text-[10px] font-bold ${trend > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground mt-1 font-medium">{subValue}</p>
    </CardContent>
  </Card>
);

const ProgressBar = ({ value, max = 100, colorClass = "bg-primary" }: { value: number, max?: number, colorClass?: string }) => (
  <div className="h-1 w-full bg-muted/30 rounded-full overflow-hidden mt-1">
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: `${Math.min(Math.max((value / max) * 100, 0), 100)}%` }}
      transition={{ duration: 1, ease: "circOut" }}
      className={`h-full ${colorClass} shadow-[0_0_8px_rgba(var(--primary),0.4)]`}
    />
  </div>
);

// --- ADVANCED VISUALIZATIONS ---

/**
 * Tactical Pitch with Pass Network and Heat Overlay
 * Coordinates based on StatsBomb 120x80 standard
 */
const TacticalPitch = ({ teamShapeData, passNetwork, color, theme = 'dark' }: any) => {
  const maxPasses = useMemo(() => passNetwork ? Math.max(...passNetwork.map((p: any) => p.passes)) : 1, [passNetwork]);

  return (
    <div className="relative w-full aspect-[1.5] bg-[#0f172a] rounded-xl overflow-hidden border border-border/50 shadow-2xl group">
      {/* Pitch Texture Overlay */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')]"></div>

      <svg viewBox="0 0 120 80" className="absolute inset-0 w-full h-full drop-shadow-2xl">
        <defs>
          <radialGradient id="nodeGradient">
            <stop offset="10%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.2" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Pitch Lines */}
        <g stroke="rgba(255,255,255,0.15)" strokeWidth="0.4" fill="none">
          <rect x="0" y="0" width="120" height="80" />
          <line x1="60" y1="0" x2="60" y2="80" />
          <circle cx="60" cy="40" r="9.15" />
          <rect x="0" y="18" width="18" height="44" />
          <rect x="102" y="18" width="18" height="44" />
          <rect x="0" y="30" width="6" height="20" />
          <rect x="114" y="30" width="6" height="20" />
          <path d="M 18 30 Q 25 40 18 50" />
          <path d="M 102 30 Q 95 40 102 50" />
        </g>

        {/* Pass Links */}
        {passNetwork?.map((link: any, i: number) => {
          const src = teamShapeData[link.sourceId];
          const trg = teamShapeData[link.targetId];
          if (!src || !trg) return null;
          const strength = (link.passes / maxPasses);
          return (
            <motion.line
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: strength * 0.6 + 0.1 }}
              key={i}
              x1={src.xSum / src.count} y1={src.ySum / src.count}
              x2={trg.xSum / trg.count} y2={trg.ySum / trg.count}
              stroke="white"
              strokeWidth={strength * 2}
              strokeDasharray="1, 0.5"
            />
          );
        })}

        {/* Player Nodes */}
        {Object.entries(teamShapeData).map(([id, pos]: any) => (
          <g key={id} className={`cursor-help transition-all duration-300 hover:scale-125 ${color}`}>
            <circle
              cx={pos.xSum / pos.count}
              cy={pos.ySum / pos.count}
              r="2.5"
              className="fill-current"
              filter="url(#glow)"
            />
            <circle cx={pos.xSum / pos.count} cy={pos.ySum / pos.count} r="3.5" fill="none" stroke="white" strokeWidth="0.2" strokeOpacity="0.5" />
            <text
              x={pos.xSum / pos.count}
              y={(pos.ySum / pos.count) - 4}
              fontSize="2.2"
              fill="white"
              textAnchor="middle"
              className="font-mono font-bold uppercase tracking-tighter"
            >
              #{id.slice(-2)}
            </text>
          </g>
        ))}
      </svg>

      <div className="absolute bottom-3 left-3 flex gap-2">
        <Badge variant="outline" className="bg-background/80 backdrop-blur-sm text-[9px] border-white/10 uppercase">
          Dynamic Pass Network
        </Badge>
      </div>
    </div>
  );
};

/**
 * Match Momentum "Worm" Chart
 */
const MomentumChart = () => {
  const data = Array.from({ length: 45 }).map((_, i) => ({
    min: i * 2,
    val: Math.sin(i * 0.5) * Math.random() * 50 + (i > 20 ? 20 : -10)
  }));

  return (
    <div className="h-48 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="momUp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="momDown" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="min" hide />
          <YAxis hide domain={[-100, 100]} />
          <RechartsTooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-popover border border-border p-2 rounded-md shadow-xl text-[10px] font-mono">
                    <p className="text-muted-foreground uppercase">Minute {payload[0].payload.min}'</p>
                    <p className="font-bold text-primary">Pressure: {payload[0].value?.toFixed(1)}%</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <ReferenceLine y={0} stroke="white" strokeOpacity={0.1} />
          <Area
            type="monotone"
            dataKey="val"
            stroke="var(--primary)"
            fill="url(#momUp)"
            strokeWidth={2}
            baseValue={0}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// --- AI ANALYTICS ENGINE PANEL ---

const AIChatPanel = ({ match }: { match: Match }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Tactical analysis for ${match.home_team.team_name} vs ${match.away_team.team_name} is ready. I've identified a significant xT (Expected Threat) surge on the left flank between minutes 30-40. What would you like to dive into?` }
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');

    // Simulate AI thinking
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Based on the tracking data, ${match.home_team.team_name}'s high press (PPDA: 8.2) is forcing turnovers in Zone 14. This has directly led to an increase in progressive carries from their CMs. xG efficiency is currently at +0.4 above model expectations.`
      }]);
    }, 1000);
  };

  return (
    <Card className="flex flex-col h-[500px] border-primary/20 shadow-2xl shadow-primary/5 overflow-hidden">
      <CardHeader className="bg-primary/5 border-b border-primary/10 py-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/20 rounded-lg">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-sm font-black uppercase tracking-tight">Tactical AI Assistant</CardTitle>
            <CardDescription className="text-[10px]">Neural Match Analysis • Live</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                  m.role === 'user' 
                  ? 'bg-primary text-primary-foreground rounded-br-none' 
                  : 'bg-muted/50 border border-border/50 rounded-bl-none'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="p-3 border-t bg-card/50">
          <div className="flex gap-2">
            <Input
              placeholder="Ask about pass maps, xT, or pressing..."
              className="text-xs h-9 bg-background/50"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleSend}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// --- MAIN PAGE COMPONENT ---

export default function MatchDetail() {
  const { matchId } = useParams<{ matchId: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [teamShape, setTeamShape] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!matchId) return;
      try {
        const [m, metrics, stats] = await Promise.all([
          getMatchById(Number(matchId)),
          getTacticalMetricsByMatch(Number(matchId)),
          getPlayerStatsByMatch(Number(matchId))
        ]);
        setMatch(m);
        setPlayerStats(stats.players || []);
        setTeamShape(stats.teamShape || {});
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [matchId]);

  const homePlayers = useMemo(() => playerStats.filter(s => s.team_id === match?.home_team_id), [playerStats, match]);
  const awayPlayers = useMemo(() => playerStats.filter(s => s.team_id === match?.away_team_id), [playerStats, match]);

  if (loading) return <div className="p-8"><Skeleton className="h-[600px] w-full" /></div>;
  if (!match) return <div className="p-8">Match data not available.</div>;

  return (
    <MainLayout>
      <div className="max-w-[1700px] mx-auto space-y-8 pb-20">

        {/* Breadcrumbs & Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="icon" className="rounded-full hover:bg-primary/10">
              <Link to="/matches"><ArrowLeft className="h-5 w-5" /></Link>
            </Button>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] h-5 px-1.5 font-mono">LIVE_FEED</Badge>
                <span className="text-xs text-muted-foreground font-mono uppercase tracking-widest">{match.competition.competition_name}</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight uppercase italic">{match.home_team.team_name} vs {match.away_team.team_name}</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="hidden md:flex gap-2 text-xs font-bold border-border/60">
              <Download className="h-3.5 w-3.5" /> Export Stats
            </Button>
            <Button variant="outline" size="sm" className="hidden md:flex gap-2 text-xs font-bold border-border/60">
              <Share2 className="h-3.5 w-3.5" /> Share Report
            </Button>
          </div>
        </div>

        {/* HERO SCOREBOARD SECTION */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-transparent to-rose-500/20 blur-xl opacity-50 group-hover:opacity-70 transition-opacity"></div>
          <Card className="relative border-0 bg-slate-950/80 backdrop-blur-xl overflow-hidden shadow-2xl">
            <CardContent className="p-0">
              <div className="grid md:grid-cols-3 items-center py-12 px-6">
                {/* Home Team */}
                <div className="flex flex-col items-center gap-4">
                  <div className="h-24 w-24 rounded-full bg-gradient-to-b from-slate-800 to-slate-900 border border-white/5 flex items-center justify-center shadow-inner relative">
                    <Shirt className="h-12 w-12 text-primary" />
                    <div className="absolute -bottom-2 bg-primary px-2 py-0.5 rounded text-[10px] font-bold text-primary-foreground">HOME</div>
                  </div>
                  <h2 className="text-3xl font-black tracking-tighter uppercase text-center max-w-[200px] leading-none">
                    {match.home_team.team_name}
                  </h2>
                  <div className="flex gap-1">
                    {Array.from({length: 5}).map((_, i) => (
                      <div key={i} className={`h-1.5 w-4 rounded-full ${i < 3 ? 'bg-primary' : 'bg-slate-800'}`} />
                    ))}
                  </div>
                </div>

                {/* Main Score Display */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-8 md:gap-16">
                    <span className="text-8xl md:text-9xl font-black font-mono tracking-tighter tabular-nums drop-shadow-[0_0_25px_rgba(var(--primary),0.3)]">
                      {match.home_score}
                    </span>
                    <div className="flex flex-col items-center gap-2">
                      <Badge variant="destructive" className="animate-pulse bg-red-600 text-[10px] font-black px-3 py-1 uppercase tracking-widest">
                        {match.match_status}
                      </Badge>
                      <span className="text-4xl font-light text-muted-foreground/30 font-serif italic tracking-widest">VS</span>
                      <span className="text-xs font-mono font-bold text-muted-foreground tracking-widest">MATCHDAY</span>
                    </div>
                    <span className="text-8xl md:text-9xl font-black font-mono tracking-tighter tabular-nums">
                      {match.away_score}
                    </span>
                  </div>

                  {/* Venue / Date Info Bar */}
                  <div className="mt-8 flex items-center gap-6 px-6 py-2 rounded-full bg-white/5 border border-white/5 text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
                    <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> Emirates Stadium</div>
                    <div className="h-1 w-1 rounded-full bg-white/20" />
                    <div className="flex items-center gap-1.5"><Users className="h-3 w-3" /> 60,213 Attendance</div>
                    <div className="h-1 w-1 rounded-full bg-white/20" />
                    <div className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {match.match_date}</div>
                  </div>
                </div>

                {/* Away Team */}
                <div className="flex flex-col items-center gap-4">
                  <div className="h-24 w-24 rounded-full bg-gradient-to-b from-slate-800 to-slate-900 border border-white/5 flex items-center justify-center shadow-inner relative">
                    <Shirt className="h-12 w-12 text-rose-500" />
                    <div className="absolute -bottom-2 bg-rose-500 px-2 py-0.5 rounded text-[10px] font-bold text-white">AWAY</div>
                  </div>
                  <h2 className="text-3xl font-black tracking-tighter uppercase text-center max-w-[200px] leading-none">
                    {match.away_team.team_name}
                  </h2>
                   <div className="flex gap-1">
                    {Array.from({length: 5}).map((_, i) => (
                      <div key={i} className={`h-1.5 w-4 rounded-full ${i < 2 ? 'bg-rose-500' : 'bg-slate-800'}`} />
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* TOP-LEVEL METRICS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <ModernStatCard label="Field Tilt" value="62.4%" subValue="Dominance in final third" icon={TrendingUp} trend={+12.1} />
          <ModernStatCard label="xG Ratio" value="2.41 vs 0.88" subValue="Expected Goals Performance" icon={Target} />
          <ModernStatCard label="Pressing Intensity" value="8.4 PPDA" subValue="Passes per defensive action" icon={Flame} />
          <ModernStatCard label="Avg. Pass Sequence" value="5.8" subValue="Number of connected passes" icon={GitCommit} />
        </div>

        {/* MAIN ANALYSIS LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT COLUMN: TACTICAL & MOMENTUM */}
          <div className="lg:col-span-8 space-y-8">
            <Tabs defaultValue="tactical" className="w-full">
              <div className="flex items-center justify-between mb-4">
                <TabsList className="bg-muted/30 p-1 border border-border/40">
                  <TabsTrigger value="tactical" className="text-xs font-bold uppercase tracking-wide px-6 py-2">Tactical Map</TabsTrigger>
                  <TabsTrigger value="momentum" className="text-xs font-bold uppercase tracking-wide px-6 py-2">Momentum</TabsTrigger>
                  <TabsTrigger value="xg" className="text-xs font-bold uppercase tracking-wide px-6 py-2">xG Timeline</TabsTrigger>
                </TabsList>
                <div className="hidden md:flex gap-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-primary font-bold uppercase">
                    <div className="h-2 w-2 rounded-full bg-primary" /> {match.home_team.team_name}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-rose-500 font-bold uppercase">
                    <div className="h-2 w-2 rounded-full bg-rose-500" /> {match.away_team.team_name}
                  </div>
                </div>
              </div>

              <TabsContent value="tactical" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-card/30 border-border/40 overflow-hidden">
                    <CardHeader className="py-4 border-b border-white/5">
                      <CardTitle className="text-sm font-black uppercase tracking-widest">{match.home_team.team_name}</CardTitle>
                      <CardDescription className="text-[10px] font-mono uppercase tracking-tighter">Average Positioning & Pass Density</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                      <TacticalPitch teamShapeData={teamShape[match.home_team_id] || {}} color="text-primary" />
                    </CardContent>
                  </Card>
                  <Card className="bg-card/30 border-border/40 overflow-hidden">
                    <CardHeader className="py-4 border-b border-white/5">
                      <CardTitle className="text-sm font-black uppercase tracking-widest">{match.away_team.team_name}</CardTitle>
                      <CardDescription className="text-[10px] font-mono uppercase tracking-tighter">Average Positioning & Pass Density</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                      <TacticalPitch teamShapeData={teamShape[match.away_team_id] || {}} color="text-rose-500" />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="momentum" className="mt-0">
                <Card className="bg-card/30 border-border/40">
                  <CardHeader>
                    <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" /> Match Pressure Worm
                    </CardTitle>
                    <CardDescription className="text-[10px]">Real-time dominance tracking based on possession, territory, and shots.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <MomentumChart />
                    <div className="flex justify-between mt-6 text-[10px] font-mono uppercase text-muted-foreground tracking-widest">
                      <span>Kick Off</span>
                      <span>HT</span>
                      <span>Full Time</span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* PLAYER PERFORMANCE DEEP DIVE */}
            <Card className="bg-card/30 border-border/40 overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between bg-muted/20 border-b border-border/40 py-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg font-black uppercase tracking-tight italic">Elite Performance Matrix</CardTitle>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3 w-3 text-muted-foreground" />
                  <Input placeholder="Filter players..." className="h-8 w-48 text-xs pl-8 bg-background/50 border-border/50" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid md:grid-cols-2 divide-x divide-border/40">
                  {/* Home Team Stats */}
                  <div className="divide-y divide-border/40">
                    <div className="p-4 bg-primary/5 flex justify-between items-center">
                      <span className="text-xs font-black uppercase tracking-widest">{match.home_team.team_name}</span>
                      <Badge variant="outline" className="text-[9px] font-mono border-primary/20 text-primary">AGGREGATE xT: 2.14</Badge>
                    </div>
                    {homePlayers.slice(0, 5).map((stat) => (
                      <div key={stat.id} className="p-4 hover:bg-white/5 transition-all group">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded bg-slate-800 border border-white/5 flex items-center justify-center font-black text-xs text-primary">
                              {stat.player?.player_name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs font-black uppercase tracking-tighter flex items-center gap-1.5">
                                {stat.player?.player_name}
                                {stat.xg > 0.4 && <Flame className="h-3 w-3 text-orange-500 fill-orange-500" />}
                              </p>
                              <p className="text-[10px] text-muted-foreground font-mono">MIDFIELD ENGINE • {stat.minutes_played}'</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-black font-mono">{(stat.xg + stat.xa).toFixed(2)}</p>
                            <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">xG+xA</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[9px] font-mono text-muted-foreground">
                              <span>Passing</span>
                              <span>92%</span>
                            </div>
                            <ProgressBar value={92} colorClass="bg-primary" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-[9px] font-mono text-muted-foreground">
                              <span>Dribbles</span>
                              <span>80%</span>
                            </div>
                            <ProgressBar value={80} colorClass="bg-emerald-500" />
                          </div>
                          <div className="flex flex-col items-center justify-center bg-white/5 rounded border border-white/5 py-1">
                             <span className="text-[10px] font-black text-primary uppercase leading-tight tracking-tighter">xT</span>
                             <span className="text-[10px] font-mono font-bold leading-tight">0.82</span>
                          </div>
                          <div className="flex flex-col items-center justify-center bg-white/5 rounded border border-white/5 py-1">
                             <span className="text-[10px] font-black text-primary uppercase leading-tight tracking-tighter">PRG</span>
                             <span className="text-[10px] font-mono font-bold leading-tight">14</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Away Team Stats */}
                  <div className="divide-y divide-border/40">
                    <div className="p-4 bg-rose-500/5 flex justify-between items-center">
                      <span className="text-xs font-black uppercase tracking-widest">{match.away_team.team_name}</span>
                      <Badge variant="outline" className="text-[9px] font-mono border-rose-500/20 text-rose-500">AGGREGATE xT: 1.08</Badge>
                    </div>
                    {awayPlayers.slice(0, 5).map((stat) => (
                      <div key={stat.id} className="p-4 hover:bg-white/5 transition-all group">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded bg-slate-800 border border-white/5 flex items-center justify-center font-black text-xs text-rose-500">
                              {stat.player?.player_name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs font-black uppercase tracking-tighter flex items-center gap-1.5">
                                {stat.player?.player_name}
                              </p>
                              <p className="text-[10px] text-muted-foreground font-mono">DEFENSIVE WALL • {stat.minutes_played}'</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-black font-mono">{(stat.xg + stat.xa).toFixed(2)}</p>
                            <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">xG+xA</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[9px] font-mono text-muted-foreground">
                              <span>Passing</span>
                              <span>76%</span>
                            </div>
                            <ProgressBar value={76} colorClass="bg-rose-500" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-[9px] font-mono text-muted-foreground">
                              <span>Duels</span>
                              <span>65%</span>
                            </div>
                            <ProgressBar value={65} colorClass="bg-slate-500" />
                          </div>
                          <div className="flex flex-col items-center justify-center bg-white/5 rounded border border-white/5 py-1">
                             <span className="text-[10px] font-black text-rose-500 uppercase leading-tight tracking-tighter">xT</span>
                             <span className="text-[10px] font-mono font-bold leading-tight">0.12</span>
                          </div>
                          <div className="flex flex-col items-center justify-center bg-white/5 rounded border border-white/5 py-1">
                             <span className="text-[10px] font-black text-rose-500 uppercase leading-tight tracking-tighter">PRG</span>
                             <span className="text-[10px] font-mono font-bold leading-tight">2</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
              <div className="p-4 bg-muted/30 border-t border-border/40 text-center">
                <Button variant="link" className="text-xs font-black uppercase tracking-widest text-primary hover:no-underline">
                  View Full Event Data Log <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </div>

          {/* RIGHT COLUMN: AI CHAT & METRICS */}
          <div className="lg:col-span-4 space-y-8">

            {/* AI CHAT INTERFACE */}
            <AIChatPanel match={match} />

            {/* ADDITIONAL DEEP DATA CARDS */}
            <Card className="bg-slate-900 border-border/40 overflow-hidden">
               <CardHeader className="bg-primary pb-4">
                 <CardTitle className="text-sm font-black uppercase text-primary-foreground tracking-widest flex items-center gap-2">
                   <Zap className="h-4 w-4" /> Tactical Edge Insights
                 </CardTitle>
               </CardHeader>
               <CardContent className="p-6 space-y-6">
                 <div className="space-y-2">
                   <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                     <Shield className="h-3 w-3" /> Defensive Line Height
                   </div>
                   <div className="flex items-center gap-4">
                     <span className="text-2xl font-black font-mono">54.2m</span>
                     <div className="flex-1 h-2 bg-white/5 rounded-full relative overflow-hidden">
                        <div className="absolute left-[54%] top-0 h-full w-1 bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                     </div>
                   </div>
                 </div>

                 <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                      <MousePointer2 className="h-3 w-3" /> Progressive Pass Success
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-black font-mono">88%</span>
                      <ProgressBar value={88} colorClass="bg-primary h-2" />
                    </div>
                 </div>

                 <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Predicted Substitution Effect</span>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground italic">
                      Introducing a fresh LW could exploit the fatigue in {match.away_team.team_name}'s RB zone, which has dropped 15% in sprint speed over the last 15 mins.
                    </p>
                 </div>
               </CardContent>
            </Card>

            <Card className="bg-card/30 border-border/40 overflow-hidden border-dashed">
              <CardContent className="p-6 text-center space-y-4">
                <Info className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-sm font-black uppercase italic tracking-tight">Need More Depth?</h4>
                  <p className="text-xs text-muted-foreground">Access our raw JSON event streams and geospatial datasets for external analysis.</p>
                </div>
                <Button variant="secondary" className="w-full text-xs font-black uppercase">
                  Documentation & API
                </Button>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </MainLayout>
  );
}