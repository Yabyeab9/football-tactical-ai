import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler


def cluster_team_styles(sequences):

    team_stats = sequences.groupby("team").agg({
        "duration": "mean",
        "num_passes": "mean",
        "num_carries": "mean",
        "end_x": "mean"
    }).reset_index()

    features = team_stats[
        ["duration", "num_passes", "num_carries", "end_x"]
    ]

    scaler = StandardScaler()
    X = scaler.fit_transform(features)

    model = KMeans(n_clusters=5, random_state=42)

    team_stats["style_cluster"] = model.fit_predict(X)

    return team_stats