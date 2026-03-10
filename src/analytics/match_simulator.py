import torch


def simulate_match(model, team_a, team_b, n_sim=1000):

    results = {
        "home_win": 0,
        "draw": 0,
        "away_win": 0
    }

    for _ in range(n_sim):

        pred = model(team_a, team_b)

        probs = torch.softmax(pred, dim=1)

        outcome = torch.multinomial(probs, 1)

        if outcome == 0:
            results["home_win"] += 1
        elif outcome == 1:
            results["draw"] += 1
        else:
            results["away_win"] += 1

    for k in results:
        results[k] /= n_sim

    return results