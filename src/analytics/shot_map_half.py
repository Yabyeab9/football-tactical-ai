import matplotlib.pyplot as plt
from mplsoccer import VerticalPitch
from src.data.load_events import load_all_events


def half_pitch_shot_map(events_df, team):

    shots = events_df[
        (events_df["team"] == team) &
        (events_df["type"] == "Shot")
    ]

    shots = shots.dropna(subset=["x", "y"])

    pitch = VerticalPitch(
        pitch_type="statsbomb",
        half=True,
        pitch_color="#0e1117",
        line_color="white"
    )

    fig, ax = pitch.draw(figsize=(8,10))

    goals = shots[shots["goal"] == 1]
    misses = shots[shots["goal"] == 0]

    pitch.scatter(
        goals["x"], goals["y"],
        s=goals["xg"]*900,
        color="#00ff9f",
        marker="*",
        edgecolors="black",
        ax=ax,
        label="Goal"
    )

    pitch.scatter(
        misses["x"], misses["y"],
        s=misses["xg"]*900,
        color="#ff4d4d",
        edgecolors="black",
        ax=ax,
        label="Miss"
    )

    plt.title(f"{team} Attacking Shot Map", fontsize=18)
    plt.legend()
    plt.show()


if __name__ == "__main__":

    df = load_all_events()

    half_pitch_shot_map(df, "Barcelona")