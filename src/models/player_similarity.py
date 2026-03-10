import pandas as pd


def build_player_features(events):

    players = events.groupby("player").agg({

        "x": "mean",
        "end_x": "mean",
        "EPV": "sum"

    }).fillna(0)

    return players

from sklearn.metrics.pairwise import cosine_similarity


def find_similar_players(player_name, player_matrix):

    similarity = cosine_similarity(player_matrix)

    sim_df = pd.DataFrame(
        similarity,
        index=player_matrix.index,
        columns=player_matrix.index
    )

    return sim_df[player_name].sort_values(ascending=False)[1:6]