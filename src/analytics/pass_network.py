import matplotlib.pyplot as plt
from mplsoccer import Pitch
from src.data.load_events import load_all_events


def generate_pass_network(events_df, team_name):

    print("Available teams:")
    print(events_df["team"].unique())

    passes = events_df[
        (events_df["team"] == team_name) &
        (events_df["type"] == "Pass")
    ]

    print("Number of passes found:", len(passes))

    # Remove rows without players
    passes = passes.dropna(subset=["player"])

    # Average player positions
    avg_positions = (
        passes.groupby("player")[["x", "y"]]
        .mean()
        .reset_index()
    )

    # Pass connections
    pass_counts = (
        passes.groupby(["player", "pass_recipient"])
        .size()
        .reset_index(name="count")
    )

    pitch = Pitch(
        pitch_type="statsbomb",
        pitch_color="#22312b",
        line_color="white"
    )
    fig, ax = pitch.draw(figsize=(10, 7))

    # Draw players
    pitch.scatter(
        avg_positions.x,
        avg_positions.y,
        s=500,
        color="red",
        ax=ax
    )

    # Player labels
    for i, row in avg_positions.iterrows():
        ax.text(row.x, row.y, row.player.split()[-1],
                ha='center', va='center', color='white')

    plt.title(f"{team_name} Pass Network")
    plt.show()


if __name__ == "__main__":

    df = load_all_events()

    generate_pass_network(df, "Barcelona")