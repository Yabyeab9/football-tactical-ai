import matplotlib.pyplot as plt
from mplsoccer import Pitch
import seaborn as sns
from src.data.load_events import load_all_events


def xg_heatmap(events_df, team):

    shots = events_df[
        (events_df["team"] == team) &
        (events_df["type"] == "Shot")
    ]

    pitch = Pitch(
        pitch_type="statsbomb",
        pitch_color="#0e1117",
        line_color="white"
    )

    fig, ax = pitch.draw(figsize=(10,7))

    sns.kdeplot(
        x=shots["x"],
        y=shots["y"],
        fill=True,
        cmap="Reds",
        alpha=0.8,
        ax=ax
    )

    plt.title(f"{team} xG Shot Density")
    plt.show()


if __name__ == "__main__":

    df = load_all_events()

    xg_heatmap(df,"Barcelona")