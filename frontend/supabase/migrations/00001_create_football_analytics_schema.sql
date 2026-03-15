-- Create competitions table
CREATE TABLE competitions (
  id BIGSERIAL PRIMARY KEY,
  competition_id INTEGER UNIQUE NOT NULL,
  competition_name TEXT NOT NULL,
  country_name TEXT,
  season_id INTEGER NOT NULL,
  season_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create teams table
CREATE TABLE teams (
  id BIGSERIAL PRIMARY KEY,
  team_id INTEGER UNIQUE NOT NULL,
  team_name TEXT NOT NULL,
  country TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create matches table
CREATE TABLE matches (
  id BIGSERIAL PRIMARY KEY,
  match_id INTEGER UNIQUE NOT NULL,
  competition_id INTEGER REFERENCES competitions(competition_id),
  season_id INTEGER NOT NULL,
  match_date DATE,
  home_team_id INTEGER REFERENCES teams(team_id),
  away_team_id INTEGER REFERENCES teams(team_id),
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  stadium TEXT,
  referee TEXT,
  match_status TEXT DEFAULT 'available',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create players table
CREATE TABLE players (
  id BIGSERIAL PRIMARY KEY,
  player_id INTEGER UNIQUE NOT NULL,
  player_name TEXT NOT NULL,
  player_nickname TEXT,
  jersey_number INTEGER,
  country TEXT,
  position TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create events table (simplified for key event types)
CREATE TABLE events (
  id BIGSERIAL PRIMARY KEY,
  event_id UUID NOT NULL,
  match_id INTEGER REFERENCES matches(match_id),
  event_index INTEGER NOT NULL,
  period INTEGER NOT NULL,
  timestamp TEXT NOT NULL,
  minute INTEGER,
  second INTEGER,
  event_type TEXT NOT NULL,
  team_id INTEGER REFERENCES teams(team_id),
  player_id INTEGER REFERENCES players(player_id),
  position_x DECIMAL(5,2),
  position_y DECIMAL(5,2),
  end_position_x DECIMAL(5,2),
  end_position_y DECIMAL(5,2),
  outcome TEXT,
  body_part TEXT,
  technique TEXT,
  xg DECIMAL(5,4),
  pass_length DECIMAL(6,2),
  pass_angle DECIMAL(6,2),
  pass_height TEXT,
  pass_type TEXT,
  carry_distance DECIMAL(6,2),
  under_pressure BOOLEAN DEFAULT FALSE,
  counterpress BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_id, event_index)
);

-- Create tactical_metrics table for computed analytics
CREATE TABLE tactical_metrics (
  id BIGSERIAL PRIMARY KEY,
  match_id INTEGER REFERENCES matches(match_id),
  team_id INTEGER REFERENCES teams(team_id),
  metric_type TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(10,4),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create player_stats table for aggregated statistics
CREATE TABLE player_stats (
  id BIGSERIAL PRIMARY KEY,
  player_id INTEGER REFERENCES players(player_id),
  match_id INTEGER REFERENCES matches(match_id),
  team_id INTEGER REFERENCES teams(team_id),
  minutes_played INTEGER DEFAULT 0,
  passes_completed INTEGER DEFAULT 0,
  passes_attempted INTEGER DEFAULT 0,
  progressive_passes INTEGER DEFAULT 0,
  shots INTEGER DEFAULT 0,
  shots_on_target INTEGER DEFAULT 0,
  total_xg DECIMAL(5,4) DEFAULT 0,
  carries INTEGER DEFAULT 0,
  carry_distance DECIMAL(8,2) DEFAULT 0,
  progressive_carries INTEGER DEFAULT 0,
  pressures INTEGER DEFAULT 0,
  successful_pressures INTEGER DEFAULT 0,
  dribbles_completed INTEGER DEFAULT 0,
  dribbles_attempted INTEGER DEFAULT 0,
  interceptions INTEGER DEFAULT 0,
  tackles INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, match_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_matches_competition ON matches(competition_id);
CREATE INDEX idx_matches_teams ON matches(home_team_id, away_team_id);
CREATE INDEX idx_matches_date ON matches(match_date);
CREATE INDEX idx_events_match ON events(match_id);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_player ON events(player_id);
CREATE INDEX idx_events_team ON events(team_id);
CREATE INDEX idx_tactical_metrics_match ON tactical_metrics(match_id);
CREATE INDEX idx_tactical_metrics_type ON tactical_metrics(metric_type);
CREATE INDEX idx_player_stats_player ON player_stats(player_id);
CREATE INDEX idx_player_stats_match ON player_stats(match_id);

-- Enable RLS
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tactical_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

-- Create public read policies (open data platform)
CREATE POLICY "Public read access" ON competitions FOR SELECT USING (true);
CREATE POLICY "Public read access" ON teams FOR SELECT USING (true);
CREATE POLICY "Public read access" ON matches FOR SELECT USING (true);
CREATE POLICY "Public read access" ON players FOR SELECT USING (true);
CREATE POLICY "Public read access" ON events FOR SELECT USING (true);
CREATE POLICY "Public read access" ON tactical_metrics FOR SELECT USING (true);
CREATE POLICY "Public read access" ON player_stats FOR SELECT USING (true);