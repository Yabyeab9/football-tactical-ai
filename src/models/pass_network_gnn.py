import torch
from torch_geometric.data import Data


def build_pass_graph(events):

    passes = events[events["type"] == "Pass"]

    players = passes["player"].unique()
    player_to_idx = {p: i for i, p in enumerate(players)}

    edges = []

    for _, row in passes.iterrows():

        if pd.isna(row["pass_recipient"]):
            continue

        p1 = player_to_idx[row["player"]]
        p2 = player_to_idx[row["pass_recipient"]]

        edges.append([p1, p2])

    edge_index = torch.tensor(edges).t().contiguous()

    x = torch.eye(len(players))

    graph = Data(x=x, edge_index=edge_index)

    return graph, players