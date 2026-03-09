import numpy as np
import pandas as pd
from src.data.load_events import load_all_events

# Grid size
N_X = 16
N_Y = 12


# -----------------------------
# Create Pitch Grid
# -----------------------------
def get_zone(x, y):

    zone_x = int(x / (120 / N_X))
    zone_y = int(y / (80 / N_Y))

    zone_x = min(zone_x, N_X - 1)
    zone_y = min(zone_y, N_Y - 1)

    return zone_x, zone_y


# -----------------------------
# Initialize xT Grid
# -----------------------------
def initialize_xt_grid():

    xt = np.zeros((N_X, N_Y))

    return xt


# -----------------------------
# Calculate Move Value
# -----------------------------
def calculate_action_xt(start_x, start_y, end_x, end_y, xt_grid):

    start_zone = get_zone(start_x, start_y)
    end_zone = get_zone(end_x, end_y)

    start_value = xt_grid[start_zone]
    end_value = xt_grid[end_zone]

    return end_value - start_value


# -----------------------------
# Assign xT to Passes
# -----------------------------
def apply_xt_to_actions(events, xt_grid):

    xt_values = []

    for _, row in events.iterrows():

        if row["type"] not in ["Pass", "Carry"]:
            xt_values.append(0)
            continue

        if any(pd.isna([row["x"], row["y"], row["end_x"], row["end_y"]])):
            xt_values.append(0)
            continue

        start_x, start_y = row["x"], row["y"]
        end_x, end_y = row["end_x"], row["end_y"]

        value = calculate_action_xt(
            start_x,
            start_y,
            end_x,
            end_y,
            xt_grid
        )

        xt_values.append(value)

    events["xT"] = xt_values

    return events


# -----------------------------
# Run Pipeline
# -----------------------------
if __name__ == "__main__":

    events = load_all_events()

    xt_grid = initialize_xt_grid()

    events = apply_xt_to_actions(events, xt_grid)

    print(events[["player", "type", "xT"]].head())