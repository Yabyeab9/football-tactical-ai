import sqlite3
from typing import List, Dict, Any

DB_PATH = "./backend/db/football.db"

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def fetch_all_matches() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, league, date as time, status, home_team, away_team, home_score, away_score
        FROM matches
        ORDER BY date DESC
    """)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]
