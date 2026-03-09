import json
from pathlib import Path

DATA_PATH = Path("data/raw/open-data-master/data/events")

def load_events():

    files = list(DATA_PATH.glob("*.json"))
    print(f"Found {len(files)} match event files")

    all_events = []

    for file in files[:10]:  # start small for testing
        with open(file, "r", encoding="utf-8") as f:
            match_events = json.load(f)

        all_events.extend(match_events)

    print(f"Loaded {len(all_events)} events")

    return all_events


if __name__ == "__main__":
    events = load_events()