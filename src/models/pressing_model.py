import pandas as pd

PRESSING_ACTIONS = [
    "Pressure",
    "Duel",
    "Interception",
    "Tackle"
]


def detect_pressures(events):

    pressures = events[
        events["type"].isin(PRESSING_ACTIONS)
    ].copy()

    pressures["pressing"] = True

    return pressures
# Pressing Intensity Metric (PPDA)
# Lower PPDA = stronger pressing.
def calculate_ppda(events):

    defensive_actions = events[
        events["type"].isin([
            "Pressure",
            "Tackle",
            "Interception"
        ])
    ]

    opponent_passes = events[
        events["type"] == "Pass"
    ]

    ppda = len(opponent_passes) / max(len(defensive_actions), 1)

    return ppda