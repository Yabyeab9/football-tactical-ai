import torch
import torch.nn.functional as F
from torch_geometric.nn import GATConv


class SpatialGNN(torch.nn.Module):

    def __init__(self, in_features):

        super().__init__()

        self.gat1 = GATConv(in_features, 64)
        self.gat2 = GATConv(64, 32)

    def forward(self, x, edge_index):

        x = self.gat1(x, edge_index)
        x = F.elu(x)

        x = self.gat2(x, edge_index)

        return x