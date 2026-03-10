from src.data.load_events import load_all_events
from src.features.passing_graph import build_graph
from src.features.spatial_features import build_player_positions
from src.models.spatiotemporal_model import FootballAI

import torch


def train_model():

    events = load_all_events()

    positions = build_player_positions(events)

    edge_index, players = build_graph(events)

    x = torch.tensor(
        positions.values,
        dtype=torch.float
    )

    model = FootballAI(x.shape[1])

    optimizer = torch.optim.Adam(
        model.parameters(),
        lr=0.001
    )

    for epoch in range(50):

        pred = model(
            x,
            edge_index,
            torch.randint(0,10,(1,20))
        )

        loss = pred.mean()

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        print("epoch", epoch)

    return model