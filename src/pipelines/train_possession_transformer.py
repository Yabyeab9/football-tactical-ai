import torch
from torch.utils.data import DataLoader

from src.data.load_events import load_all_events
from src.features.possession_builder import build_possessions
from src.features.sequence_encoder import encode_sequence
from src.models.possession_transformer import PossessionTransformer


def build_sequences(events):

    sequences = []

    grouped = events.groupby("possession_id")

    for _, group in grouped:

        seq = encode_sequence(group)

        if len(seq) < 3:
            continue

        sequences.append(seq)

    return sequences


def train_transformer():

    events = load_all_events()

    events = build_possessions(events)

    sequences = build_sequences(events)

    model = PossessionTransformer()

    optimizer = torch.optim.Adam(
        model.parameters(),
        lr=0.001
    )

    for epoch in range(20):

        for seq in sequences:

            x = torch.tensor(seq).unsqueeze(0)

            pred = model(x)

            loss = pred.mean()

            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

        print("epoch", epoch)

    return model