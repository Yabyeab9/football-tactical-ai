from src.data.load_events import load_all_events
from src.features.possessions import build_possessions
from src.analytics.sequence_analysis import compute_possession_metrics
from src.analytics.counter_attack_detection import detect_counter_attacks
from src.analytics.buildup_analysis import analyze_buildup
from src.models.playstyle_cluster import cluster_team_styles


def run_pipeline():

    print("Loading events...")
    events = load_all_events()

    print("Building possessions...")
    events = build_possessions(events)

    print("Analyzing sequences...")
    sequences = compute_possession_metrics(events)

    print("Detecting counter attacks...")
    counters = detect_counter_attacks(sequences)

    print("Analyzing buildup...")
    sequences = analyze_buildup(sequences)

    print("Clustering team playstyles...")
    styles = cluster_team_styles(sequences)

    print("Pipeline complete")

    return sequences, counters, styles


if __name__ == "__main__":
    run_pipeline()