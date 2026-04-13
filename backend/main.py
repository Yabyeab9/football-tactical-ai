import os
import asyncio
import httpx
from fastapi import FastAPI, HTTPException
from services.live_data import get_live_matches, format_live_matches
from fastapi.middleware.cors import CORSMiddleware
from services.tactical_engine import TacticalEngine
from services.ai_analyst import AIAnalyst

app = FastAPI(title="Football Tactical AI Backend")

# Configuration
API_KEY = os.getenv("FOOTBALL_API_KEY")
HEADERS = {"x-apisports-key": API_KEY, "x-rapidapi-host": "v3.football.api-sports.io"}
BASE_URL = "https://v3.football.api-sports.io"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tighten this for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ai_analyst = AIAnalyst()

from services.api_clients import get_live_scores, get_fixture_details_sportmonks


@app.get("/live-matches")
async def live_matches():
    try:
        data = await get_live_scores()
        return data
    except Exception:
        # fallback
        from services.api_clients import get_matches_fallback
        return await get_matches_fallback()

@app.get("/match-details/{fixture_id}")
async def get_match_full_details(fixture_id: int):
    try:
        data = await get_fixture_details_sportmonks(fixture_id)
    except Exception:
        raise HTTPException(status_code=503, detail="Primary API failed")

    fixture = data["data"]
    # Fetch data concurrently to save time
    tasks = [
        client.get(f"{BASE_URL}/fixtures?id={fixture_id}", headers=HEADERS),
        client.get(f"{BASE_URL}/fixtures/statistics?fixture={fixture_id}", headers=HEADERS),
        client.get(f"{BASE_URL}/fixtures/events?fixture={fixture_id}", headers=HEADERS),
        client.get(f"{BASE_URL}/fixtures/lineups?fixture={fixture_id}", headers=HEADERS)
    ]

    responses = await asyncio.gather(*tasks)

    # Error handling
    for res in responses:
        if res.status_code != 200:
            raise HTTPException(status_code=500, detail="External API Error")

    fixture_res = responses[0].json()['response'][0]
    stats_res = responses[1].json()['response']
    events_res = responses[2].json()['response']
    lineups_res = responses[3].json()['response']

    # 1. Initialize Tactical Engine Calculations
    engine = TacticalEngine()

    # 2. Extract Home/Away Stats
    home_stats_raw = stats_res[0]['statistics']
    away_stats_raw = stats_res[1]['statistics']

    # 3. Calculate Advanced Metrics
    home_xg = engine.calculate_xg([e for e in events_res if e['team']['id'] == fixture_res['teams']['home']['id']])
    away_xg = engine.calculate_xg([e for e in events_res if e['team']['id'] == fixture_res['teams']['away']['id']])

    ppda_home = engine.calculate_ppda(home_stats_raw)
    ppda_away = engine.calculate_ppda(away_stats_raw)

    momentum_worm = engine.generate_momentum_worm(events_res, fixture_res['fixture']['status']['elapsed'] or 90)

    # 4. Process Player-Specific Tactical Stats (xT, Progressive Actions)
    # In a real app, you'd map events to specific player IDs
    processed_players = []
    for team in lineups_res:
        for p in team['startXI']:
            player_data = p['player']
            # Simulate tactical metrics for each player
            player_data['xt'] = engine.calculate_xt([])  # Pass events here
            player_data['xg'] = 0.05  # Mocked
            processed_players.append(player_data)

    return {
        "id": fixture_id,
        "match_info": {
            "home": fixture_res['teams']['home'],
            "away": fixture_res['teams']['away'],
            "score": fixture_res['goals'],
            "status": fixture_res['fixture']['status'],
            "venue": fixture_res['fixture']['venue'],
        },
        "advanced_metrics": {
            "home": {"xg": home_xg, "ppda": ppda_home, "field_tilt": "62%"},
            "away": {"xg": away_xg, "ppda": ppda_away, "field_tilt": "38%"}
        },
        "momentum_worm": momentum_worm,
        "events": events_res,
        "lineups": lineups_res
        }


@app.post("/ai/analyze")
async def analyze_match(payload: dict):
    """
    Endpoint for the Frontend AI Chat.
    Payload: { "fixture_id": 123, "query": "Why is the home team struggling?" }
    """
    # 1. Get match context (simplified for demo)
    context = f"Match ID {payload['fixture_id']} is currently 2-1. Home team has 65% possession."

    # 2. Get AI Analysis
    insight = await ai_analyst.get_tactical_insight(context, payload['query'])

    return {"role": "assistant", "content": insight}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
