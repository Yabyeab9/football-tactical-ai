import torch
import torch.nn as nn


class TacticalAgent(nn.Module):

    def __init__(self, state_dim=4, actions=5):

        super().__init__()

        self.net = nn.Sequential(

            nn.Linear(state_dim, 64),
            nn.ReLU(),

            nn.Linear(64, 64),
            nn.ReLU(),

            nn.Linear(64, actions)
        )

    def forward(self, x):

        return self.net(x)

#     Actions could represent:
#     0 pass
# 1 carry
# 2 cross
# 3 through ball
# 4 shoot