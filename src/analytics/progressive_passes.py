import numpy as np

GOAL_X = 120
GOAL_Y = 40


def distance_to_goal(x, y):

    return np.sqrt((GOAL_X - x)**2 + (GOAL_Y - y)**2)


def is_progressive(row):

    if row["type"] != "Pass":
        return False

    if any(np.isnan([row["x"], row["y"], row["end_x"], row["end_y"]])):
        return False

    start_dist = distance_to_goal(row["x"], row["y"])
    end_dist = distance_to_goal(row["end_x"], row["end_y"])

    return (start_dist - end_dist) > 10