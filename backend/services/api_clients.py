import os
import httpx

SPORTMONKS_TOKEN = os.getenv("SPORTMONKS_TOKEN")
FOOTBALL_DATA_TOKEN = os.getenv("FOOTBALL_DATA_TOKEN")

SPORTMONKS_URL = "https://api.sportmonks.com/v3/football"
FOOTBALL_DATA_URL = "https://api.football-data.org/v4"
SPORTSDB_URL = "https://www.thesportsdb.com/api/v1/json/3"


# 🟢 UI DATA (TheSportsDB)
async def get_live_scores():
    async with httpx.AsyncClient() as client:
        res = await client.get(f"{SPORTSDB_URL}/livescore.php?s=Soccer")
        return res.json()


# 🔵 PRIMARY (SportMonks)
async def get_fixture_details_sportmonks(fixture_id):
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{SPORTMONKS_URL}/fixtures/{fixture_id}",
            params={"api_token": SPORTMONKS_TOKEN, "include": "statistics,events,lineups"}
        )
        res.raise_for_status()
        return res.json()


# 🟡 FALLBACK (Football-Data)
async def get_matches_fallback():
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{FOOTBALL_DATA_URL}/matches",
            headers={"X-Auth-Token": FOOTBALL_DATA_TOKEN}
        )
        res.raise_for_status()
        return res.json()