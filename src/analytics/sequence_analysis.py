import pandas as pd


def compute_possession_metrics(events):

    grouped = events.groupby("possession_id")

    sequences = []

    for pid, group in grouped:

        team = group["team"].iloc[0]

        start_x = group["x"].iloc[0]
        end_x = group["end_x"].dropna().iloc[-1] if group["end_x"].notna().any() else start_x

        duration = group["second"].max() - group["second"].min()

        passes = (group["type"] == "Pass").sum()
        carries = (group["type"] == "Carry").sum()

        shot = (group["type"] == "Shot").any()

        seq = {
            "possession_id": pid,
            "team": team,
            "start_x": start_x,
            "end_x": end_x,
            "duration": duration,
            "num_passes": passes,
            "num_carries": carries,
            "shot": shot
        }

        sequences.append(seq)

    return pd.DataFrame(sequences)