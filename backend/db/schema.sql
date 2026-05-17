-- SQLite schema for matches table
CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY,
    league TEXT NOT NULL,
    date TEXT NOT NULL,
    status TEXT NOT NULL,
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    home_score INTEGER,
    away_score INTEGER
);
