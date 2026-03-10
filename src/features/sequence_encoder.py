ACTION_MAP = {
    "Pass": 1,
    "Carry": 2,
    "Shot": 3,
    "Dribble": 4,
    "Cross": 5,
    "Pressure": 6,
    "Interception": 7
}


def encode_sequence(possession_events):

    sequence = []

    for _, row in possession_events.iterrows():

        action = row["type"]

        token = ACTION_MAP.get(action, 0)

        sequence.append(token)

    return sequence