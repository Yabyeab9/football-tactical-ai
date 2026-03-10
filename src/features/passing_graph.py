import torch
from torch_geometric.data import Data


def build_graph(events):

    passes = events[events["type"] == "Pass"]

    players = list(set(passes["player"]).union(
        set(passes["pass_recipient"])
    ))

    player_to_idx = {p: i for i, p in enumerate(players)}

    edges = []

    for _, row in passes.iterrows():

        if row["pass_recipient"] not in player_to_idx:
            continue

        src = player_to_idx[row["player"]]
        dst = player_to_idx[row["pass_recipient"]]

        edges.append([src, dst])

    edge_index = torch.tensor(edges).t().contiguous()

    return edge_index, players