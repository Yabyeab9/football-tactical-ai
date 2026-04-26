import type { ReactNode } from "react";

import AIAssistant from "./pages/AIAssistant";
import AIPredictions from "./pages/AIPredictions";
import Analytics from "./pages/Analytics";
import Dashboard from "./pages/Dashboard";
import InjuryAnalysis from "./pages/InjuryAnalysis";
import ManagerAnalysis from "./pages/ManagerAnalysis";
import MatchDetail from "./pages/MatchDetail";
import Matches from "./pages/Matches";
import PlayerDetail from "./pages/PlayerDetail";
import Players from "./pages/Players";
import TacticalLab from "./pages/TacticalLab";
import Teams from "./pages/Teams";

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
}

const routes: RouteConfig[] = [
  { name: "Overview Dashboard", path: "/", element: <Dashboard /> },
  { name: "Live Matches", path: "/matches", element: <Matches /> },
  { name: "Teams", path: "/teams", element: <Teams /> },
  { name: "Managers", path: "/managers", element: <ManagerAnalysis /> },
  { name: "Match Detail", path: "/matches/:matchId", element: <MatchDetail /> },
  { name: "Match Analysis Hub", path: "/analysis", element: <Analytics /> },
  { name: "Player Intelligence", path: "/players", element: <Players /> },
  { name: "Player Detail", path: "/players/:playerId", element: <PlayerDetail /> },
  { name: "Tactical Engine", path: "/tactical-engine", element: <TacticalLab /> },
  { name: "Injury Center", path: "/injury-center", element: <InjuryAnalysis /> },
  { name: "AI Football Assistant", path: "/ai-assistant", element: <AIAssistant /> },
  { name: "Predictions Hub", path: "/predictions", element: <AIPredictions /> },
];

export default routes;
