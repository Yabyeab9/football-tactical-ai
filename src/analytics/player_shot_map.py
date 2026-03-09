import matplotlib.pyplot as plt
from mplsoccer import VerticalPitch
from src.data.load_events import load_all_events


def player_shot_map(events_df, player):

    shots = events_df[
        (events_df["player"] == player) &
        (events_df["type"] == "Shot")
    ]

    pitch = VerticalPitch(
        pitch_type="statsbomb",
        half=True,
        pitch_color="#111111",
        line_color="white"
    )

    fig, ax = pitch.draw(figsize=(8,10))

    pitch.scatter(
        shots["x"],
        shots["y"],
        s=shots["xg"]*1000,
        c=shots["xg"],
        cmap="Reds",
        edgecolors="black",
        ax=ax
    )

    plt.title(f"{player} Shot Map")
    plt.show()


if __name__ == "__main__":

    df = load_all_events()

    player_shot_map(df,"Lionel Messi")