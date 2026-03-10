from src.data.load_events import load_all_events
from src.models.epv_model import build_epv_dataset, train_epv


def train_epv_pipeline():

    print("Loading events...")
    events = load_all_events()

    print("Building EPV dataset...")
    dataset = build_epv_dataset(events)

    print("Training EPV model...")
    epv = train_epv(dataset)

    print("EPV grid trained")

    return epv


if __name__ == "__main__":
    train_epv_pipeline()