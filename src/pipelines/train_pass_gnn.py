from src.data.load_events import load_all_events
from src.models.pass_network_gnn import build_pass_graph
from src.models.gnn_model import PassGNN

import torch


def train_pass_network():

    events = load_all_events()

    graph, players = build_pass_graph(events)

    model = PassGNN(graph.num_features)

    optimizer = torch.optim.Adam(
        model.parameters(),
        lr=0.01
    )

    for epoch in range(100):

        optimizer.zero_grad()

        out = model(graph.x, graph.edge_index)

        loss = (out ** 2).mean()

        loss.backward()

        optimizer.step()

    return out, players