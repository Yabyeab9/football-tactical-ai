import Dashboard from './pages/Dashboard';
import Matches from './pages/Matches';
import Teams from './pages/Teams';
import Players from './pages/Players';
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
