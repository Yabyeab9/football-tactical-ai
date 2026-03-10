from sklearn.metrics.pairwise import cosine_similarity

def find_similar_players(player_vector, all_vectors):

    similarity = cosine_similarity(
        [player_vector],
        all_vectors
    )

    return similarity