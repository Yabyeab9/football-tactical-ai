import torch

from src.data.load_events import load_all_events
from src.features.team_embeddings import build_team_features
from src.models.match_state_model import MatchStateModel


def train_simulator():

    events = load_all_events()

    team_features = build_team_features(events)

    X = torch.tensor(team_features.values, dtype=torch.float)

    model = MatchStateModel(X.shape[1])

    optimizer = torch.optim.Adam(
        model.parameters(),
        lr=0.001
    )

    for epoch in range(50):

        loss = model(X[:1], X[1:2]).mean()

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        print("epoch", epoch)

    return model