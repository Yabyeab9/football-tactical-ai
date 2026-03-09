import pandas as pd


def build_possessions(events):

    events = events.sort_values(
        ["match_id", "minute", "second"]
    ).reset_index(drop=True)

    possession_id = 0
    possession_ids = []

    last_team = None

    for _, row in events.iterrows():

        team = row["team"]

        if last_team is None:
            possession_id += 1

        elif team != last_team:
            possession_id += 1

        elif row["type"] in ["Shot", "Foul Committed", "Out"]:
            possession_id += 1

        possession_ids.append(possession_id)
        last_team = team

    events["possession_id"] = possession_ids

    return events