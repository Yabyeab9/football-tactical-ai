import pandas as pd

# converts teams into feature vectors.
def build_team_features(events):

    team_stats = events.groupby("team").agg({

        "x": "mean",
        "end_x": "mean",
        "EPV": "sum"

    }).fillna(0)

    return team_stats