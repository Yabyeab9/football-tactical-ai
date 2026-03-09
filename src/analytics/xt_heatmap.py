import matplotlib.pyplot as plt
import seaborn as sns
from mplsoccer import Pitch

# Visualize xT Heatmap
def plot_xt_heatmap(events):

    pitch = Pitch(pitch_type="statsbomb")

    fig, ax = pitch.draw()

    sns.kdeplot(
        x=events["x"],
        y=events["y"],
        fill=True,
        cmap="Reds",
        alpha=0.8,
        ax=ax
    )

    plt.title("Expected Threat Zones")

    plt.show()

#  Player xT Leaders shows Most dangerous creators

def player_xt_leaders(events):

    table = events.groupby("player")["xT"].sum()

    table = table.sort_values(ascending=False)

    print(table.head(10))