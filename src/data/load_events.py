import json
from pathlib import Path
import pandas as pd
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



def load_all_events():

    data_dir = Path("data/raw/open-data-master/data/events")

    files = list(data_dir.glob("*.json"))
    print(f"Found {len(files)} match event files")

    all_events = []

    for file in files:

        with open(file, encoding="utf-8") as f:
            events = json.load(f)

        df = pd.json_normalize(events)

        # Basic columns
        df["team"] = df["team.name"]
        df["player"] = df["player.name"]
        df["type"] = df["type.name"]
        df["pass_recipient"] = df["pass.recipient.name"]

        # start location
        df["x"] = df["location"].apply(
            lambda x: x[0] if isinstance(x, list) else None
        )

        df["y"] = df["location"].apply(
            lambda x: x[1] if isinstance(x, list) else None
        )

        # pass end location
        df["end_x"] = df["pass.end_location"].apply(
            lambda x: x[0] if isinstance(x, list) else None
        )

        df["end_y"] = df["pass.end_location"].apply(
            lambda x: x[1] if isinstance(x, list) else None
        )

        # carry end location
        df["carry_end_x"] = df["carry.end_location"].apply(
            lambda x: x[0] if isinstance(x, list) else None
        )

        df["carry_end_y"] = df["carry.end_location"].apply(
            lambda x: x[1] if isinstance(x, list) else None
        )

        # merge pass/carry end positions
        df["end_x"] = df["end_x"].fillna(df["carry_end_x"])
        df["end_y"] = df["end_y"].fillna(df["carry_end_y"])

        all_events.append(df)

    events_df = pd.concat(all_events, ignore_index=True)
    events_df.to_parquet("data/processed/events.parquet")
    print(f"Loaded {len(events_df)} events")

    return events_df
if __name__ == "__main__":
    events = load_events()