def detect_counter_attacks(sequences):

    counters = sequences[
        (sequences["start_x"] < 40) &
        (sequences["end_x"] > 80) &
        (sequences["duration"] <= 10) &
        (sequences["num_passes"] <= 5)
    ]

    counters["counter_attack"] = True

    return counters