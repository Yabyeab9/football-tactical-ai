import matplotlib.pyplot as plt
from mplsoccer import Pitch
from src.data.load_events import load_all_events


def compare_teams(events_df, team1, team2):

    pitch = Pitch(pitch_type="statsbomb")

    fig, axs = pitch.grid(
        ncols=2,
        figsize=(14,6),
        pitch_color="#0e1117",
        line_color="white"
    )

    teams = [team1, team2]

    for ax, team in zip(axs["pitch"].flat, teams):

        shots = events_df[
            (events_df["team"] == team) &
            (events_df["type"] == "Shot")
        ]

        pitch.scatter(
            shots["x"],
            shots["y"],
            s=shots["xg"]*800,
            color="red",
            ax=ax
        )

        ax.set_title(team)

    plt.show()


if __name__ == "__main__":

    df = load_all_events()

    compare_teams(df,"Barcelona","Real Madrid")