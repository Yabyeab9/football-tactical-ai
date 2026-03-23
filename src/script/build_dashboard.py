import sys
from pathlib import Path
import json
import pandas as pd

sys.path.append(str(Path(__file__).resolve().parents[2]))

from src.data.load_events import load_all_events

# --- LOAD EVENTS ---
events = load_all_events()

# --- LOAD MATCHES ---
BASE_DIR = Path(__file__).resolve().parents[2]
matches_path = BASE_DIR / "src/data/raw/open-data-master/data/matches"
competition = BASE_DIR / "src/data/raw/open-data-master/data/competitions.json"

all_matches = []

for file in matches_path.glob("*.json"):
    with open(file, encoding="utf-8") as f:
        data = json.load(f)

        # some files contain lists
        if isinstance(data, list):
            all_matches.extend(data)
        else:
            all_matches.append(data)

with open(competition, encoding="utf-8") as f:
    competitions = json.load(f)
matches_df = pd.json_normalize(all_matches)
competition_df = pd.json_normalize(competitions)
# DEBUG (keep this once)
print("MATCH COLUMNS:", matches_df.columns.tolist())

# --- SAFE COLUMN DETECTION ---
competition_col = next(
    (col for col in matches_df.columns if "competition" in col and "name" in col),
    None
)

# --- FINAL STATS ---
stats = {
    "total_matches": events["match_id"].nunique(),  # ✅ correct
    "total_teams": events["team"].nunique(),
    "total_players": events["player"].nunique(),
    "total_competitions": competition_df["competition_id"].nunique(),

}

# --- SAVE ---
output_dir = BASE_DIR / "src/data/processed"
output_dir.mkdir(parents=True, exist_ok=True)

with open(output_dir / "dashboard.json", "w") as f:
    json.dump(stats, f, indent=2)

print("✅ Dashboard data built")
print(stats)