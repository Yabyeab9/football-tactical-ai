-- Elite Football Intelligence OS Schema
-- Designed for high-performance tactical analysis and AI ingestion

-- Competitions (Leagues, Cups)
CREATE TABLE IF NOT EXISTS competitions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT,
    country TEXT,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teams
CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    short_name TEXT,
    tla TEXT,
    crest_url TEXT,
    venue TEXT,
    founded INTEGER,
    website TEXT,
    club_colors TEXT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Players
CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    date_of_birth DATE,
    nationality TEXT,
    position TEXT,
    shirt_number INTEGER,
    market_value REAL,
    current_team_id TEXT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (current_team_id) REFERENCES teams(id)
);

-- Matches
CREATE TABLE IF NOT EXISTS matches (
    id TEXT PRIMARY KEY,
    competition_id TEXT NOT NULL,
    season TEXT,
    utc_date TIMESTAMP NOT NULL,
    status TEXT NOT NULL,
    matchday INTEGER,
    stage TEXT,
    group_name TEXT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    home_team_id TEXT NOT NULL,
    away_team_id TEXT NOT NULL,
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    venue TEXT,
    attendance INTEGER,
    minute INTEGER DEFAULT 0,
    FOREIGN KEY (competition_id) REFERENCES competitions(id),
    FOREIGN KEY (home_team_id) REFERENCES teams(id),
    FOREIGN KEY (away_team_id) REFERENCES teams(id)
);

-- Events (Shots, Passes, Cards, etc.)
-- This is where the tactical intelligence lives
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    match_id TEXT NOT NULL,
    team_id TEXT NOT NULL,
    player_id TEXT,
    event_type TEXT NOT NULL,
    minute INTEGER NOT NULL,
    second INTEGER,
    x_coord REAL,
    y_coord REAL,
    end_x_coord REAL,
    end_y_coord REAL,
    outcome TEXT, -- 'success', 'fail', etc.
    metadata JSON, -- Tactical details like 'under_pressure', 'xg_value'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (match_id) REFERENCES matches(id),
    FOREIGN KEY (team_id) REFERENCES teams(id),
    FOREIGN KEY (player_id) REFERENCES players(id)
);

-- Tactical Snapshots (Formations, Momentum)
-- Periodically stored snapshots of the game state
CREATE TABLE IF NOT EXISTS tactical_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id TEXT NOT NULL,
    minute INTEGER NOT NULL,
    home_formation TEXT,
    away_formation TEXT,
    home_momentum REAL,
    away_momentum REAL,
    home_threat REAL,
    away_threat REAL,
    ai_narrative TEXT, -- Generated insight at this timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (match_id) REFERENCES matches(id)
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_matches_utc_date ON matches(utc_date);
CREATE INDEX IF NOT EXISTS idx_events_match_id ON events(match_id);
CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(current_team_id);
CREATE INDEX IF NOT EXISTS idx_tactical_snapshots_match_id ON tactical_snapshots(match_id);
