import torch
import torch.nn as nn

from src.models.spatial_gnn import SpatialGNN
from src.models.sequence_transformer import SequenceTransformer


class FootballAI(nn.Module):

    def __init__(self, spatial_features):

        super().__init__()

        self.gnn = SpatialGNN(spatial_features)

        self.transformer = SequenceTransformer()

        self.fc = nn.Linear(96, 1)

    def forward(self, x, edge_index, seq):

        spatial = self.gnn(x, edge_index)

        sequence = self.transformer(seq)

        combined = torch.cat([
            spatial.mean(dim=0),
            sequence
        ], dim=1)

        return self.fc(combined)