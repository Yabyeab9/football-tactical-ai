import numpy as np
from src.analytics.train_xt_model import get_zone


def calculate_xt_action(row, xt_grid):

    if row["type"] not in ["Pass", "Carry"]:
        return 0

    if any(np.isnan([row["x"], row["y"], row["end_x"], row["end_y"]])):
        return 0

    start = get_zone(row["x"], row["y"])
    end = get_zone(row["end_x"], row["end_y"])

    start_value = xt_grid[start]
    end_value = xt_grid[end]

    return end_value - start_value


def apply_xt(events, xt_grid):

    events["xT"] = events.apply(
        lambda r: calculate_xt_action(r, xt_grid),
        axis=1
    )

    return events