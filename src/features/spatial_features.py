import pandas as pd


def build_player_positions(events):

    positions = events.groupby("player").agg({
        "x": "mean",
        "y": "mean",
        "end_x": "mean",
        "end_y": "mean"
    }).fillna(0)

    return positions