import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

def find_similar_players(player_vector, all_players):

    similarities = cosine_similarity(
        [player_vector],
        all_players
    )

    ranked = np.argsort(similarities[0])[::-1]

    return ranked[:10]