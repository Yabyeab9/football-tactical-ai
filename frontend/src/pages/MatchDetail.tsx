import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getMatchById,
  getTacticalMetricsByMatch,
  getPlayerStatsByMatch
} from '@/db/api';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Trophy,
  Clock,
  Shirt,
  Target,
  Activity,
  Crosshair,
  Flame,
  Zap,
  Shield,
  GitCommit
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Match, TacticalMetric, PlayerStats } from '@/types';

// --- Helper Components ---

const ProgressBar = ({ value, max = 100, colorClass = "bg-primary" }: { value: number, max?: number, colorClass?: string }) => (
  <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden mt-1.5">
    <div
      className={`h-full ${colorClass} transition-all duration-500 ease-out`}
      style={{ width: `${Math.min(Math.max((value / max) * 100, 0), 100)}%` }}
    />
  </div>
);

const StatBox = ({ label, value, highlight = false, icon: Icon }: { label: string, value: string | number, highlight?: boolean, icon?: any }) => (
  <div className={`flex flex-col p-2 rounded-lg bg-muted/10 border border-border/40 backdrop-blur-sm transition-all ${highlight ? 'bg-primary/10 border-primary/30 shadow-[0_0_10px_rgba(var(--primary),0.1)]' : 'hover:bg-muted/20'}`}>
    <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </span>
    <span className={`font-mono text-sm ${highlight ? 'font-bold text-primary' : 'font-medium text-foreground'}`}>{value}</span>
  </div>
);

// --- Advanced SVG Visualizations ---

type PassLink = { sourceId: number; targetId: number; passes: number };

const TacticalPitch = ({
  teamShapeData,
  passNetwork,
  color
}: {
  teamShapeData: Record<number, { xSum: number; ySum: number; count: number }>,
  passNetwork?: PassLink[],
  color: string
}) => {
  const maxPasses = passNetwork ? Math.max(...passNetwork.map(p => p.passes)) : 1;

  return (
    <div className="relative w-full max-w-2xl mx-auto aspect-[1.5] bg-[#1a2e23] border border-border/50 rounded-xl overflow-hidden shadow-2xl">
      <svg viewBox="0 0 120 80" className="absolute inset-0 w-full h-full">
        {/* Pitch Markings */}
        <g stroke="white" strokeWidth="0.3" strokeOpacity="0.3" fill="none">
          <rect x="0" y="0" width="120" height="80" />
          <line x1="60" y1="0" x2="60" y2="80" />
          <circle cx="60" cy="40" r="9.15" />
          <rect x="0" y="18" width="18" height="44" />
          <rect x="102" y="18" width="18" height="44" />
          <rect x="0" y="30" width="5.5" height="20" />
          <rect x="114.5" y="30" width="5.5" height="20" />
        </g>

        {/* Pass Network Lines */}
        {passNetwork && passNetwork.map((link, idx) => {
          const source = teamShapeData[link.sourceId];
          const target = teamShapeData[link.targetId];
          if (!source || !target || source.count === 0 || target.count === 0) return null;

          const sx = source.xSum / source.count;
          const sy = source.ySum / source.count;
          const tx = target.xSum / target.count;
          const ty = target.ySum / target.count;
          const intensity = link.passes / maxPasses;

          return (
            <line
              key={`link-${idx}`}
              x1={sx} y1={sy} x2={tx} y2={ty}
              stroke="url(#pass-gradient)"
              strokeWidth={intensity * 1.5}
              strokeOpacity={intensity * 0.8 + 0.2}
            />
          );
        })}

        {/* Player Nodes */}
        {Object.entries(teamShapeData).map(([pId, pos]) => {
          if (pos.count === 0) return null;
          const avgX = pos.xSum / pos.count;
          const avgY = pos.ySum / pos.count;

          // Calculate node size based on involvement (if pass data exists)
          const involvement = passNetwork
            ? passNetwork.filter(l => l.sourceId === Number(pId) || l.targetId === Number(pId)).reduce((sum, l) => sum + l.passes, 0)
            : 10;
          const radius = Math.max(1.5, Math.min(3, involvement / 15));

          return (
            <g key={pId}>
              <circle cx={avgX} cy={avgY} r={radius} className={color} style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.8))' }} />
              <circle cx={avgX} cy={avgY} r={radius + 1} fill="none" stroke="white" strokeWidth="0.2" strokeOpacity="0.8" />
              <text x={avgX} y={avgY - radius - 1} fontSize="2.5" fill="white" textAnchor="middle" opacity="0.8" className="font-mono">{pId.slice(-2)}</text>
            </g>
          );
        })}

        <defs>
          <linearGradient id="pass-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#888" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0.9" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

// Elite Radar Chart for Player Comparisons
const RadarChart = ({ players, metrics }: { players: PlayerStats[], metrics: { key: keyof PlayerStats, label: string, max: number }[] }) => {
  const size = 300;
  const center = size / 2;
  const radius = size * 0.35;
  const colors = ['#3b82f6', '#ef4444']; // Blue vs Red

  const getPoints = (player: PlayerStats) => {
    return metrics.map((m, i) => {
      const angle = (Math.PI * 2 * i) / metrics.length - Math.PI / 2;
      const value = Math.min(Number(player[m.key] || 0) / m.max, 1);
      return `${center + radius * value * Math.cos(angle)},${center + radius * value * Math.sin(angle)}`;
    }).join(' ');
  };

  return (
    <div className="relative w-full max-w-md mx-auto aspect-square">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full font-mono text-[10px]">
        {/* Background Web */}
        {[0.25, 0.5, 0.75, 1].map(scale => (
          <polygon
            key={scale}
            points={metrics.map((_, i) => {
              const angle = (Math.PI * 2 * i) / metrics.length - Math.PI / 2;
              return `${center + radius * scale * Math.cos(angle)},${center + radius * scale * Math.sin(angle)}`;
            }).join(' ')}
            fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1"
          />
        ))}

        {/* Axes and Labels */}
        {metrics.map((m, i) => {
          const angle = (Math.PI * 2 * i) / metrics.length - Math.PI / 2;
          const x = center + radius * 1.15 * Math.cos(angle);
          const y = center + radius * 1.15 * Math.sin(angle);
          return (
            <g key={m.key}>
              <line x1={center} y1={center} x2={center + radius * Math.cos(angle)} y2={center + radius * Math.sin(angle)} stroke="currentColor" strokeOpacity="0.2" />
              <text x={x} y={y} fill="currentColor" textAnchor="middle" alignmentBaseline="middle" opacity="0.7">{m.label}</text>
            </g>
          );
        })}

        {/* Player Polygons */}
        {players.map((player, idx) => (
          <polygon
            key={player.id}
            points={getPoints(player)}
            fill={colors[idx]}
            fillOpacity="0.2"
            stroke={colors[idx]}
            strokeWidth="2"
            style={{ filter: `drop-shadow(0px 0px 4px ${colors[idx]}80)` }}
          />
        ))}
      </svg>
      {/* Legend */}
      <div className="absolute top-2 left-2 right-2 flex justify-between px-4">
        {players.map((p, i) => (
          <div key={p.id} className="flex items-center gap-2 text-sm font-bold" style={{ color: colors[i] }}>
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[i] }} />
            {p.player?.player_name.split(' ').pop()}
          </div>
        ))}
      </div>
    </div>
  );
};

export default function MatchDetail() {
  const { matchId } = useParams<{ matchId: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [tacticalMetrics, setTacticalMetrics] = useState<TacticalMetric[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [teamShape, setTeamShape] = useState<Record<number, Record<number, { xSum: number; ySum: number; count: number }>>>({});
  const [loading, setLoading] = useState(true);

  // Mock Pass Networks (In production, derive this from event chains)
  const mockPassNetwork = useMemo(() => {
    return (players: PlayerStats[]) => {
      const links: PassLink[] = [];
      const ids = players.map(p => p.id);
      for(let i=0; i<8; i++) {
        links.push({
          sourceId: ids[Math.floor(Math.random() * ids.length)],
          targetId: ids[Math.floor(Math.random() * ids.length)],
          passes: Math.floor(Math.random() * 20) + 5
        });
      }
      return links;
    };
  }, []);

  useEffect(() => {
    async function loadMatchData() {
      if (!matchId) return;
      try {
        const [matchData, metrics, statsData] = await Promise.all([
          getMatchById(Number.parseInt(matchId)),
          getTacticalMetricsByMatch(Number.parseInt(matchId)),
          getPlayerStatsByMatch(Number.parseInt(matchId)),
        ]);
        setMatch(matchData);
        setTacticalMetrics(metrics);
        setPlayerStats(statsData.players || []);
        setTeamShape(statsData.teamShape || {});
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadMatchData();
  }, [matchId]);

  if (loading) return <MainLayout><div className="space-y-6 animate-pulse"><div className="h-10 w-64 bg-muted rounded"></div><div className="h-64 w-full bg-muted rounded"></div></div></MainLayout>;
  if (!match) return <MainLayout><div className="text-center py-12"><Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">Match not found</p></div></MainLayout>;

  const homeMetrics = tacticalMetrics.filter(m => m.team_id === match.home_team_id);
  const awayMetrics = tacticalMetrics.filter(m => m.team_id === match.away_team_id);

  const homePlayerStats = playerStats.filter(s => s.team_id === match.home_team_id).sort((a, b) => b.minutes_played - a.minutes_played);
  const awayPlayerStats = playerStats.filter(s => s.team_id === match.away_team_id).sort((a, b) => b.minutes_played - a.minutes_played);

  // Aggregations + Mocking xT for demo if not present in DB yet
  const getAgg = (stats: PlayerStats[], key: keyof PlayerStats) => stats.reduce((sum, p) => sum + (Number(p[key]) || 0), 0);
  const homeXG = getAgg(homePlayerStats, 'xg');
  const awayXG = getAgg(awayPlayerStats, 'xg');
  const homeXT = getAgg(homePlayerStats, 'xt' as any) || (homeXG * 1.8); // Fallback mock
  const awayXT = getAgg(awayPlayerStats, 'xt' as any) || (awayXG * 1.6);

  // For Radar
  const topHomePlayer = homePlayerStats.sort((a, b) => (Number(b['xt' as any]) || b.xg) - (Number(a['xt' as any]) || a.xg))[0];
  const topAwayPlayer = awayPlayerStats.sort((a, b) => (Number(b['xt' as any]) || b.xg) - (Number(a['xt' as any]) || a.xg))[0];

  return (
    <MainLayout>
      <div className="space-y-8 pb-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="icon" className="rounded-full">
              <Link to="/matches"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div>
              <h1 className="text-3xl font-black tracking-tight uppercase">Match Center</h1>
              <p className="text-muted-foreground text-sm font-mono tracking-widest mt-1">
                {match.competition?.competition_name} / {match.match_date}
              </p>
            </div>
          </div>
        </div>

        {/* Scoreboard Hero */}
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-background via-muted/20 to-background relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20"></div>
          <CardContent className="pt-8 pb-10 relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              {/* Home */}
              <div className="flex-1 flex flex-col items-center">
                <h2 className="text-3xl font-black tracking-tighter uppercase">{match.home_team?.team_name}</h2>
                <div className="text-7xl font-black mt-2 tracking-tighter tabular-nums drop-shadow-lg">{match.home_score}</div>
                <div className="mt-4 flex gap-3">
                  <Badge variant="outline" className="font-mono bg-background/50 text-muted-foreground">xG: <span className="text-foreground ml-1">{homeXG.toFixed(2)}</span></Badge>
                  <Badge variant="outline" className="font-mono bg-primary/10 text-primary border-primary/20"><Zap className="w-3 h-3 mr-1 inline"/>xT: {homeXT.toFixed(2)}</Badge>
                </div>
              </div>

              {/* Status */}
              <div className="flex flex-col items-center space-y-4">
                <Badge variant="default" className="text-xs uppercase tracking-widest px-4 py-1.5 animate-pulse bg-primary/80 hover:bg-primary text-primary-foreground">
                  {match.match_status}
                </Badge>
                <div className="text-muted-foreground/30 font-black text-2xl italic tracking-widest">VS</div>
                {match.match_week && <span className="text-xs font-mono text-muted-foreground">WK {match.match_week}</span>}
              </div>

              {/* Away */}
              <div className="flex-1 flex flex-col items-center">
                <h2 className="text-3xl font-black tracking-tighter uppercase">{match.away_team?.team_name}</h2>
                <div className="text-7xl font-black mt-2 tracking-tighter tabular-nums drop-shadow-lg">{match.away_score}</div>
                <div className="mt-4 flex gap-3">
                  <Badge variant="outline" className="font-mono bg-background/50 text-muted-foreground">xG: <span className="text-foreground ml-1">{awayXG.toFixed(2)}</span></Badge>
                  <Badge variant="outline" className="font-mono bg-destructive/10 text-destructive border-destructive/20"><Zap className="w-3 h-3 mr-1 inline"/>xT: {awayXT.toFixed(2)}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deep Dive Tabs */}
        <Tabs defaultValue="stats" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-muted/30 p-1 border border-border/50 rounded-lg">
            <TabsTrigger value="stats" className="font-semibold tracking-wide">Elite Player Stats</TabsTrigger>
            <TabsTrigger value="tactical" className="font-semibold tracking-wide">Tactical Shape</TabsTrigger>
            <TabsTrigger value="chains" className="font-semibold tracking-wide">Possession & Press</TabsTrigger>
            <TabsTrigger value="radar" className="font-semibold tracking-wide">Head-to-Head</TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-2">
              {/* Home Team Player Grid */}
              <Card className="shadow-xl border-border/40 bg-card/40 backdrop-blur-sm">
                <CardHeader className="bg-muted/20 border-b border-border/30 pb-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl font-black uppercase tracking-tight">{match.home_team?.team_name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/30">
                    {homePlayerStats.map((stat) => {
                      const passPct = stat.passes_attempted ? (stat.passes_completed / stat.passes_attempted) * 100 : 0;
                      // Fallback mock for xT
                      const xTValue = (stat as any).xt || (stat.key_passes * 0.15 + stat.progressive_passes * 0.05);

                      return (
                        <div key={stat.id} className="p-4 hover:bg-muted/20 transition-all flex flex-col gap-3 group">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-sm flex items-center gap-2">
                              {stat.player?.player_name}
                              {xTValue > 0.4 && <Zap className="h-4 w-4 text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]" />}
                              {stat.xg > 0.5 && <Flame className="h-4 w-4 text-orange-500" />}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">{stat.minutes_played}'</span>
                          </div>

                          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                            <div className="col-span-4 sm:col-span-8 mb-1">
                              <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                                <span>Pass Accuracy</span>
                                <span className="font-mono">{stat.passes_completed}/{stat.passes_attempted} ({passPct.toFixed(0)}%)</span>
                              </div>
                              <ProgressBar value={passPct} colorClass={passPct > 85 ? 'bg-green-500' : 'bg-primary'} />
                            </div>
                            <StatBox label="xT" value={xTValue.toFixed(2)} highlight={xTValue > 0.3} icon={Zap} />
                            <StatBox label="xG" value={stat.xg.toFixed(2)} highlight={stat.xg > 0.2} icon={Target} />
                            <StatBox label="xA" value={stat.xa.toFixed(2)} />
                            <StatBox label="Prog Pass" value={stat.progressive_passes} icon={GitCommit} />
                            <StatBox label="Carries" value={stat.carries} />
                            <StatBox label="Tackles" value={stat.tackles} icon={Shield} />
                            <StatBox label="Ints" value={stat.interceptions} />
                            <StatBox label="Clear" value={stat.clearances} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Away Team Player Grid (Identical structure, mapped to awayPlayerStats) */}
               <Card className="shadow-xl border-border/40 bg-card/40 backdrop-blur-sm">
                <CardHeader className="bg-muted/20 border-b border-border/30 pb-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl font-black uppercase tracking-tight">{match.away_team?.team_name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/30">
                    {awayPlayerStats.map((stat) => {
                      const passPct = stat.passes_attempted ? (stat.passes_completed / stat.passes_attempted) * 100 : 0;
                      const xTValue = (stat as any).xt || (stat.key_passes * 0.15 + stat.progressive_passes * 0.05);

                      return (
                        <div key={stat.id} className="p-4 hover:bg-muted/20 transition-all flex flex-col gap-3 group">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-sm flex items-center gap-2">
                              {stat.player?.player_name}
                              {xTValue > 0.4 && <Zap className="h-4 w-4 text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]" />}
                              {stat.xg > 0.5 && <Flame className="h-4 w-4 text-orange-500" />}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">{stat.minutes_played}'</span>
                          </div>

                          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                            <div className="col-span-4 sm:col-span-8 mb-1">
                              <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                                <span>Pass Accuracy</span>
                                <span className="font-mono">{stat.passes_completed}/{stat.passes_attempted} ({passPct.toFixed(0)}%)</span>
                              </div>
                              <ProgressBar value={passPct} colorClass={passPct > 85 ? 'bg-green-500' : 'bg-destructive'} />
                            </div>
                            <StatBox label="xT" value={xTValue.toFixed(2)} highlight={xTValue > 0.3} icon={Zap} />
                            <StatBox label="xG" value={stat.xg.toFixed(2)} highlight={stat.xg > 0.2} icon={Target} />
                            <StatBox label="xA" value={stat.xa.toFixed(2)} />
                            <StatBox label="Prog Pass" value={stat.progressive_passes} icon={GitCommit} />
                            <StatBox label="Carries" value={stat.carries} />
                            <StatBox label="Tackles" value={stat.tackles} icon={Shield} />
                            <StatBox label="Ints" value={stat.interceptions} />
                            <StatBox label="Clear" value={stat.clearances} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tactical" className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-2">
              <Card className="shadow-xl border-border/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl font-black uppercase">
                    <Crosshair className="h-5 w-5 text-primary" />
                    {match.home_team?.team_name} Network
                  </CardTitle>
                  <CardDescription>Average positions & pass volume</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                   {teamShape[match.home_team_id] ? (
                    <TacticalPitch
                      teamShapeData={teamShape[match.home_team_id]}
                      passNetwork={mockPassNetwork(homePlayerStats)}
                      color="fill-primary"
                    />
                  ) : (
                    <div className="h-64 flex items-center justify-center bg-muted/20 rounded-xl border border-dashed border-border/50">Data Unavailable</div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-xl border-border/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl font-black uppercase">
                    <Crosshair className="h-5 w-5 text-destructive" />
                    {match.away_team?.team_name} Network
                  </CardTitle>
                  <CardDescription>Average positions & pass volume</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {teamShape[match.away_team_id] ? (
                    <TacticalPitch
                      teamShapeData={teamShape[match.away_team_id]}
                      passNetwork={mockPassNetwork(awayPlayerStats)}
                      color="fill-destructive"
                    />
                  ) : (
                    <div className="h-64 flex items-center justify-center bg-muted/20 rounded-xl border border-dashed border-border/50">Data Unavailable</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="chains" className="space-y-6">
            <Card className="shadow-xl border-border/40 bg-card/40">
              <CardHeader>
                <CardTitle className="text-xl font-black uppercase">Phase of Play Metrics</CardTitle>
                <CardDescription>Pressing intensity (PPDA) and Possession Chains</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                  {/* PPDA Visualizer */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <Shield className="h-4 w-4" /> PPDA (Pressing Intensity)
                    </h4>
                    <p className="text-xs text-muted-foreground mb-4">Lower number = More intense pressing.</p>

                    <div className="flex items-center gap-4 bg-muted/20 p-4 rounded-lg border border-border/50">
                      <div className="flex-1 text-right">
                        <div className="font-mono text-2xl font-bold text-primary">8.4</div>
                        <div className="text-[10px] uppercase text-muted-foreground">{match.home_team?.team_name}</div>
                      </div>
                      <div className="h-8 w-[2px] bg-border/50"></div>
                      <div className="flex-1">
                        <div className="font-mono text-2xl font-bold text-destructive">12.1</div>
                        <div className="text-[10px] uppercase text-muted-foreground">{match.away_team?.team_name}</div>
                      </div>
                    </div>
                  </div>

                  {/* Sequences / Chains */}
                  <div className="space-y-4">
                     <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <GitCommit className="h-4 w-4" /> 10+ Pass Sequences
                    </h4>
                     <p className="text-xs text-muted-foreground mb-4">Sustained possession chains.</p>

                     <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-xs font-mono mb-1">
                            <span>{match.home_team?.team_name}</span>
                            <span>14 sequences</span>
                          </div>
                          <ProgressBar value={14} max={20} colorClass="bg-primary" />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs font-mono mb-1">
                            <span>{match.away_team?.team_name}</span>
                            <span>6 sequences</span>
                          </div>
                          <ProgressBar value={6} max={20} colorClass="bg-destructive" />
                        </div>
                     </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="radar" className="space-y-6">
             <Card className="shadow-xl border-border/40 bg-card/40 overflow-hidden">
                <CardHeader className="text-center pb-0 border-b border-border/10">
                  <CardTitle className="text-2xl font-black uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-primary to-destructive">
                    Key Matchup Analysis
                  </CardTitle>
                  <CardDescription className="mt-2 mb-6">Comparing the highest xT contributors from both sides</CardDescription>
                </CardHeader>
                <CardContent className="pt-8 pb-12 flex flex-col items-center">
                  {topHomePlayer && topAwayPlayer ? (
                    <RadarChart
                      players={[topHomePlayer, topAwayPlayer]}
                      metrics={[
                        { key: 'xg', label: 'xG', max: 1.0 },
                        { key: 'xa', label: 'xA', max: 0.5 },
                        { key: 'passes_completed', label: 'Passes', max: 80 },
                        { key: 'progressive_passes', label: 'Prog Pass', max: 15 },
                        { key: 'carries', label: 'Carries', max: 10 },
                        { key: 'tackles', label: 'Def Actions', max: 8 },
                      ]}
                    />
                  ) : (
                    <p className="text-muted-foreground">Insufficient data for radar comparison.</p>
                  )}
                </CardContent>
              </Card>
          </TabsContent>

        </Tabs>
      </div>
    </MainLayout>
  );
}