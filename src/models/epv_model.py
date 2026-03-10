import numpy as np

N_X = 16
N_Y = 12

#  EPV Grid Initialization
def initialize_epv():

    return np.zeros((N_X, N_Y))

PITCH_LENGTH = 120
PITCH_WIDTH = 80

#Zone Mapping (same as xT)

def get_zone(x, y):

    zone_x = int(x / (PITCH_LENGTH / N_X))
    zone_y = int(y / (PITCH_WIDTH / N_Y))

    zone_x = min(zone_x, N_X - 1)
    zone_y = min(zone_y, N_Y - 1)

    return zone_x, zone_y
# Build Possession Value Dataset
def build_epv_dataset(events):

    dataset = []

    for _, row in events.iterrows():

        if row["type"] not in ["Pass", "Carry", "Shot"]:
            continue

        if np.isnan(row["x"]) or np.isnan(row["y"]):
            continue

        zone = get_zone(row["x"], row["y"])

        value = 0

        if row["type"] == "Shot":
            value = 1

        dataset.append((zone, value))

    return dataset
# Train EPV Values

def train_epv(dataset):

    epv = initialize_epv()
    counts = np.zeros_like(epv)

    for zone, value in dataset:

        x, y = zone

        epv[x, y] += value
        counts[x, y] += 1

    counts[counts == 0] = 1

    epv = epv / counts

    return epv