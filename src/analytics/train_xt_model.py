import numpy as np
import pandas as pd
from src.data.load_events import load_all_events
from scipy.ndimage import gaussian_filter

def smooth_xt(xt):

    return gaussian_filter(xt, sigma=1.5)

N_X = 16
N_Y = 12

PITCH_LENGTH = 120
PITCH_WIDTH = 80
# Convert Location → Zone
def get_zone(x, y):

    zone_x = int(x / (PITCH_LENGTH / N_X))
    zone_y = int(y / (PITCH_WIDTH / N_Y))

    zone_x = min(zone_x, N_X - 1)
    zone_y = min(zone_y, N_Y - 1)

    return zone_x, zone_y
#  Build Shot Probability Map
def build_shot_probability(events):

    shot_counts = np.zeros((N_X, N_Y))
    move_counts = np.zeros((N_X, N_Y))

    for _, row in events.iterrows():

        if pd.isna(row["x"]) or pd.isna(row["y"]):
            continue

        zx, zy = get_zone(row["x"], row["y"])

        if row["type"] == "Shot":
            shot_counts[zx, zy] += 1

        elif row["type"] in ["Pass", "Carry"]:
            move_counts[zx, zy] += 1

    total = shot_counts + move_counts
    total[total == 0] = 1

    return shot_counts / total
# Build Goal Probability Map
def build_goal_probability(events):

    goals = np.zeros((N_X, N_Y))
    shots = np.zeros((N_X, N_Y))

    for _, row in events.iterrows():

        if row["type"] != "Shot":
            continue

        if pd.isna(row["x"]) or pd.isna(row["y"]):
            continue

        zx, zy = get_zone(row["x"], row["y"])

        shots[zx, zy] += 1

        if row.get("shot.outcome.name") == "Goal":
            goals[zx, zy] += 1

    shots[shots == 0] = 1

    return goals / shots
#Build Transition Matrix

def build_transition_matrix(events):

    transition = np.zeros((N_X, N_Y, N_X, N_Y))

    for _, row in events.iterrows():

        if row["type"] not in ["Pass", "Carry"]:
            continue

        if any(pd.isna([row["x"], row["y"], row["end_x"], row["end_y"]])):
            continue

        start = get_zone(row["x"], row["y"])
        end = get_zone(row["end_x"], row["end_y"])

        transition[start[0], start[1], end[0], end[1]] += 1

    for x in range(N_X):
        for y in range(N_Y):

            total = transition[x, y].sum()

            if total > 0:
                transition[x, y] /= total

    return transition

# Solve xT Values (Iterative)

def solve_xt(shot_prob, goal_prob, transition):

    xt = np.zeros((N_X, N_Y))

    for _ in range(50):

        new_xt = np.copy(xt)

        for x in range(N_X):
            for y in range(N_Y):

                shoot_value = shot_prob[x, y] * goal_prob[x, y]

                move_value = 0

                for nx in range(N_X):
                    for ny in range(N_Y):

                        move_value += (
                            transition[x, y, nx, ny] * xt[nx, ny]
                        )

                move_value *= (1 - shot_prob[x, y])

                new_xt[x, y] = shoot_value + move_value

        xt = new_xt

    return xt

# Full Training Pipeline

if __name__ == "__main__":

    print("Loading events...")

    events = load_all_events()

    print("Building probabilities...")

    shot_prob = build_shot_probability(events)

    goal_prob = build_goal_probability(events)

    transition = build_transition_matrix(events)

    print("Training xT model...")

    xt = solve_xt(shot_prob, goal_prob, transition)
    xt = smooth_xt(xt)
    print("xT Grid:")
    print(xt)