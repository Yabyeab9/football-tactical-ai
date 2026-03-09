import matplotlib.pyplot as plt
from mplsoccer import Pitch
from src.data.load_events import load_all_events


def generate_shot_map(events_df, team_name):

    print("Available teams:")
    print(events_df["team"].unique())

    shots = events_df[
        (events_df["team"] == team_name) &
        (events_df["type"] == "Shot")
    ]

    shots = shots.dropna(subset=["x", "y"])

    print("Number of shots:", len(shots))

    pitch = Pitch(
        pitch_type="statsbomb",
        pitch_color="#22312b",
        line_color="white"
    )

    fig, ax = pitch.draw(figsize=(12, 8))

    # Separate goals and misses
    goals = shots[shots["goal"] == 1]
    misses = shots[shots["goal"] == 0]

    pitch.scatter(
        goals["x"], goals["y"],
        s=goals["xg"] * 900,
        c="green",
        marker="*",
        ax=ax,
        label="Goal"
    )

    pitch.scatter(
        misses["x"], misses["y"],
        s=misses["xg"] * 900,
        c="red",
        marker="o",
        ax=ax,
        label="Miss"
    )

    plt.legend()
    plt.title(f"{team_name} Shot Map", fontsize=18)
    plt.show()


def plot_shot_map(shots_df):

    pitch = Pitch(
        pitch_type="statsbomb",
        pitch_color="#0e1117",
        line_color="white"
    )

    fig, ax = pitch.draw(figsize=(10, 7))

    colors = shots_df["xg"]

    scatter = pitch.scatter(
        shots_df["x"],
        shots_df["y"],
        s=shots_df["xg"] * 800,
        c=colors,
        cmap="Reds",
        edgecolors="black",
        ax=ax
    )

    plt.colorbar(scatter, ax=ax, label="Expected Goals (xG)")
    plt.title("Shot Map (Size = xG)", fontsize=16)
    plt.show()


if __name__ == "__main__":
    df = load_all_events()
    generate_shot_map(df, "Barcelona")