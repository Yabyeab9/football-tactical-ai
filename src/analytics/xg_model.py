import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from src.data.load_events import load_all_events


def prepare_shot_data(events_df):

    shots = events_df[events_df["type"] == "Shot"].copy()

    shots = shots.dropna(subset=["x", "y"])

    # Goal label
    shots["goal"] = shots["shot.outcome.name"] == "Goal"

    # Distance to goal
    goal_x = 120
    goal_y = 40

    shots["distance"] = np.sqrt((goal_x - shots["x"])**2 + (goal_y - shots["y"])**2)

    # Simple shooting angle
    shots["angle"] = np.arctan2(abs(goal_y - shots["y"]), abs(goal_x - shots["x"]))

    return shots


def train_xg_model(shots):

    X = shots[["distance", "angle"]]
    y = shots["goal"].astype(int)

    model = LogisticRegression()
    model.fit(X, y)

    shots["xg"] = model.predict_proba(X)[:, 1]

    return model, shots


if __name__ == "__main__":

    df = load_all_events()

    shots = prepare_shot_data(df)

    model, shots = train_xg_model(shots)

    print("Total shots:", len(shots))
    print("Total goals:", shots["goal"].sum())

    print("\nExample xG values:")
    print(shots[["distance", "angle", "xg"]].head())
    from src.analytics.shot_map import plot_shot_map

    shots_df = shots.copy()

    # remove rows where location is missing
    shots_df = shots_df.dropna(subset=["location"])

    # extract x and y coordinates
    shots_df["x"] = shots_df["location"].apply(lambda loc: loc[0])
    shots_df["y"] = shots_df["location"].apply(lambda loc: loc[1])

    plot_shot_map(shots_df)