import sys
from pathlib import Path

# Fix import path
sys.path.append(str(Path(__file__).resolve().parents[2]))

import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
from mplsoccer import Pitch

from src.data.load_events import load_all_events


# -----------------------------
# Page Config
# -----------------------------
st.set_page_config(
    page_title="Football Tactical AI",
    page_icon="⚽",
    layout="wide"
)

st.title("⚽ Football Tactical AI Dashboard")
st.markdown("Interactive football analytics dashboard")


# -----------------------------
# Load Data
# -----------------------------
@st.cache_data
def load_data():
    return load_all_events()


df = load_data()

# -----------------------------
# Fix xG column if missing
# -----------------------------
if "xg" not in df.columns:
    if "shot.statsbomb_xg" in df.columns:
        df["xg"] = df["shot.statsbomb_xg"]
    else:
        df["xg"] = 0.05  # fallback value


# -----------------------------
# Team Selection
# -----------------------------
teams = sorted(df["team"].dropna().unique())

team = st.selectbox("Select Team", teams)

shots = df[(df["team"] == team) & (df["type"] == "Shot")]

shots = shots.dropna(subset=["x", "y"])


# -----------------------------
# Team Stats
# -----------------------------
col1, col2, col3 = st.columns(3)

with col1:
    st.metric("Total Shots", len(shots))

with col2:
    goals = (shots["shot.outcome.name"] == "Goal").sum()
    st.metric("Goals", goals)

with col3:
    st.metric("Total xG", round(shots["xg"].sum(), 2))


# -----------------------------
# Shot Map
# -----------------------------
st.subheader(f"{team} Shot Map")

pitch = Pitch(
    pitch_type="statsbomb",
    pitch_color="#0e1117",
    line_color="white"
)

fig, ax = pitch.draw(figsize=(10, 6))

scatter = pitch.scatter(
    shots["x"],
    shots["y"],
    s=shots["xg"] * 1200,
    c=shots["xg"],
    cmap="Reds",
    edgecolors="black",
    ax=ax
)

cbar = plt.colorbar(scatter)
cbar.set_label("Expected Goals (xG)")

st.pyplot(fig)