import Dashboard from './pages/Dashboard';
import Matches from './pages/Matches';
import MatchDetail from './pages/MatchDetail';
import Teams from './pages/Teams';
import Players from './pages/Players';
import InjuryAnalysis from './pages/InjuryAnalysis';
import ManagerAnalysis from './pages/ManagerAnalysis';
import AIPredictions from './pages/AIPredictions';
import UndiscoveredInsights from './pages/UndiscoveredInsights';
import TacticalLab from './pages/TacticalLab';
import Scouting from './pages/Scouting';
import AIAssistant from './pages/AIAssistant';
import Analytics from './pages/Analytics';
import Competitions from './pages/Competitions';
import Settings from './pages/Settings';
import type { ReactNode } from 'react';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
  {
    name: 'Dashboard',
    path: '/',
    element: <Dashboard />,
  },
  {
    name: 'Matches',
    path: '/matches',
    element: <Matches />,
  },
  {
    name: 'Match Detail',
    path: '/matches/:matchId',
    element: <MatchDetail />,

  },
  {
    name: 'Teams',
    path: '/teams',
    element: <Teams />,
  },
  {
    name: 'Players',
    path: '/players',
    element: <Players />,
  },
  {
    name: 'Injury Analysis',
    path: '/injury-analysis',
    element: <InjuryAnalysis />,
  },
  {
    name: 'Manager Analysis',
    path: '/manager-analysis',
    element: <ManagerAnalysis />,
  },
  {
    name: 'AI Predictions',
    path: '/ai-predictions',
    element: <AIPredictions />,
  },
  {
    name: 'Undiscovered Insights',
    path: '/undiscovered-insights',
    element: <UndiscoveredInsights />,
  },
  {
    name: 'Tactical Lab',
    path: '/tactical-lab',
    element: <TacticalLab />,
  },
  {
    name: 'Scouting',
    path: '/scouting',
    element: <Scouting />,
  },
  {
    name: 'AI Assistant',
    path: '/ai-assistant',
    element: <AIAssistant />,
  },
  {
    name: 'Analytics',
    path: '/analytics',
    element: <Analytics />,
  },
  {
    name: 'Competitions',
    path: '/competitions',
    element: <Competitions />,
  },
  {
    name: 'Settings',
    path: '/settings',
    element: <Settings />,
  },
];

export default routes;
