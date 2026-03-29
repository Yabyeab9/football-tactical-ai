from fastapi import FastAPI
from services.live_data import get_live_matches, format_live_matches
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()  # ✅ create app FIRST

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # your frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/live-matches")
def live_matches():
    raw_data = get_live_matches()
    return format_live_matches(raw_data)