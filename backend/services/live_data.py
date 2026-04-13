import requests,os

API_KEY = os.getenv("FOOTBALL_API_KEY")
#2066a2baba1d5da56959d652bc41dfa9
headers = {
    "x-apisports-key": API_KEY
}
def format_live_matches(data):
    matches = []

    for match in data["response"]:
        matches.append({
            "id": match["fixture"]["id"],
            "league": match["league"]["name"],
            "time": match["fixture"]["date"],
            "status": match["fixture"]["status"]["short"],
            "home_team": match["teams"]["home"]["name"],
            "away_team": match["teams"]["away"]["name"],
            "home_score": match["goals"]["home"],
            "away_score": match["goals"]["away"]
        })

    return matches
def get_live_matches():
    from datetime import datetime

    today = datetime.now().strftime("%Y-%m-%d")
    url = f"https://v3.football.api-sports.io/fixtures?date={today}"
    response = requests.get(url, headers=headers)
    return response.json()