from src.models.epv_model import get_zone


def calculate_epv_action(row, epv_grid):

    if row["type"] not in ["Pass", "Carry"]:
        return 0

    start = get_zone(row["x"], row["y"])
    end = get_zone(row["end_x"], row["end_y"])

    start_val = epv_grid[start]
    end_val = epv_grid[end]

    return end_val - start_val

def apply_epv(events, epv_grid):

    events["EPV"] = events.apply(
        lambda r: calculate_epv_action(r, epv_grid),
        axis=1
    )

    return events