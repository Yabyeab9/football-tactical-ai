import torch
import torch.nn as nn


class MatchStateModel(nn.Module):

    def __init__(self, features):

        super().__init__()

        self.fc1 = nn.Linear(features * 2, 64)
        self.fc2 = nn.Linear(64, 32)

        self.out = nn.Linear(32, 3)

    def forward(self, team_a, team_b):

        x = torch.cat([team_a, team_b], dim=1)

        x = torch.relu(self.fc1(x))
        x = torch.relu(self.fc2(x))

        return self.out(x)