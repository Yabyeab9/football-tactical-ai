import pandas as pd


def analyze_buildup(sequences):

    sequences["build_up_length"] = (
        sequences["num_passes"] +
        sequences["num_carries"]
    )

    sequences["directness"] = (
        sequences["end_x"] - sequences["start_x"]
    )

    return sequences