import torch
import torch.nn.functional as F
from torch_geometric.nn import GATConv


class PassingGNN(torch.nn.Module):

    def __init__(self, features):

        super().__init__()

        self.gat1 = GATConv(features, 32)
        self.gat2 = GATConv(32, 16)

    def forward(self, x, edge_index):

        x = self.gat1(x, edge_index)
        x = F.elu(x)

        x = self.gat2(x, edge_index)

        return x