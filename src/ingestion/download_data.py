import os
import requests
import zipfile
from pathlib import Path

DATA_URL = "https://github.com/statsbomb/open-data/archive/refs/heads/master.zip"

RAW_DATA_PATH = Path("data/raw")

def download_dataset():

    RAW_DATA_PATH.mkdir(parents=True, exist_ok=True)

    zip_path = RAW_DATA_PATH / "statsbomb.zip"

    print("Downloading StatsBomb dataset...")

    r = requests.get(DATA_URL)

    with open(zip_path, "wb") as f:
        f.write(r.content)

    print("Download complete")

    print("Extracting dataset...")

    with zipfile.ZipFile(zip_path, "r") as zip_ref:
        zip_ref.extractall(RAW_DATA_PATH)

    print("Extraction complete")

if __name__ == "__main__":
    download_dataset()