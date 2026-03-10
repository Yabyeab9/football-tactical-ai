import torch
import torch.nn.functional as F
from torch_geometric.nn import GCNConv


class PassGNN(torch.nn.Module):

    def __init__(self, num_features):

        super().__init__()

        self.conv1 = GCNConv(num_features, 32)
        self.conv2 = GCNConv(32, 16)

    def forward(self, x, edge_index):

        x = self.conv1(x, edge_index)
        x = F.relu(x)

        x = self.conv2(x, edge_index)

        return x