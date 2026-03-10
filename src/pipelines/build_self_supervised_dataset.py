from src.data.load_events import load_all_events
from src.features.possessions import build_possessions
from src.features.sequence_encoder import encode_sequence
from src.features.masked_sequences import mask_sequence


def build_dataset():

    events = load_all_events()

    events = build_possessions(events)

    sequences = []

    for _, group in events.groupby("possession_id"):

        seq = encode_sequence(group)

        if len(seq) < 4:
            continue

        masked, labels = mask_sequence(seq)

        sequences.append((masked, labels))

    return sequences