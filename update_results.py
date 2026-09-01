import json
import requests

def get_api_data(url):
    try:
        res = requests.get(url, timeout=10)
        res.raise_for_status()
        return res.json()
    except Exception as e:
        print(f"Virhe haettaessa osoitteesta {url}: {e}")
        return None

def update_other_predictions(local_data):
    season = "2026"
    updated = False

    # 1. HAE SARJATAULUKKO
    standings = get_api_data(f"https://liiga.fi/api/v2/get_standings?season={season}")
    if standings:
        sorted_teams = sorted(standings, key=lambda x: x.get('rank', 99))
        
        karpat_rank = None
        for team in sorted_teams:
            if team.get('teamName') == 'Kärpät':
                karpat_rank = f"{team.get('rank')}."
                break

        updates_map = {
            "RUNKOSARJA 1.": f"{sorted_teams[0].get('teamName')}" if len(sorted_teams) > 0 else None,
            "RUNKOSARJA 2.": f"{sorted_teams[1].get('teamName')}" if len(sorted_teams) > 1 else None,
            "RUNKOSARJA 3.": f"{sorted_teams[2].get('teamName')}" if len(sorted_teams) > 2 else None,
            "Runkosarjan viimeinen": f"{sorted_teams[-1].get('teamName')}" if len(sorted_teams) > 0 else None,
            "Kärppien liigasijoitus": karpat_rank
        }

        for item in local_data.get('other_predictions', []):
            q_title = item.get('question', '')
            for key, val in updates_map.items():
                if key.lower() in q_title.lower() and val:
                    if item.get('current_leader') != val:
                        item['current_leader'] = val
                        updated = True

    # 2. HAE PELAAJATILASTOT
    players = get_api_data(f"https://liiga.fi/api/v2/stats/players?season={season}")
    if players:
        karpat_players = [p for p in players if p.get('teamName') == 'Kärpät']

        top_scorer = sorted(players, key=lambda x: (x.get('points', 0), x.get('goals', 0)), reverse=True)[0]
        top_goalscorer = sorted(players, key=lambda x: x.get('goals', 0), reverse=True)[0]
        top_pim = sorted(players, key=lambda x: x.get('penaltyMinutes', 0), reverse=True)[0]
        top_plusminus = sorted(players, key=lambda x: x.get('plusMinus', -999), reverse=True)[0]
        worst_plusminus = sorted(players, key=lambda x: x.get('plusMinus', 999))[0]

        k_top_scorer = sorted(karpat_players, key=lambda x: (x.get('points', 0), x.get('goals', 0)), reverse=True)[0] if karpat_players else {}
        k_top_goalscorer = sorted(karpat_players, key=lambda x: x.get('goals', 0), reverse=True)[0] if karpat_players else {}
        k_top_pim = sorted(karpat_players, key=lambda x: x.get('penaltyMinutes', 0), reverse=True)[0] if karpat_players else {}
        k_top_plusminus = sorted(karpat_players, key=lambda x: x.get('plusMinus', -999), reverse=True)[0] if karpat_players else {}

        player_updates = {
            "Liigan paras pistepörssissä": f"{top_scorer.get('firstName')} {top_scorer.get('lastName')} ({top_scorer.get('teamName')})",
            "Kärppien paras pistepörssissä": f"{k_top_scorer.get('firstName')} {k_top_scorer.get('lastName')}",
            "Liigan paras maalintekijä": f"{top_goalscorer.get('firstName')} {top_goalscorer.get('lastName')} ({top_goalscorer.get('teamName')})",
            "Kärppien paras maalintekijä": f"{k_top_goalscorer.get('firstName')} {k_top_goalscorer.get('lastName')}",
            "Liigan jäähykuningas": f"{top_pim.get('firstName')} {top_pim.get('lastName')} ({top_pim.get('teamName')})",
            "Kärppien jäähykuningas": f"{k_top_pim.get('firstName')} {k_top_pim.get('lastName')}",
            "Liigan paras +/- tilastossa": f"{top_plusminus.get('firstName')} {top_plusminus.get('lastName')} ({top_plusminus.get('plusMinus')})",
            "Kärppien paras +/- tilastossa": f"{k_top_plusminus.get('firstName')} {k_top_plusminus.get('lastName')} ({k_top_plusminus.get('plusMinus')})",
            "Liigan huonoin +/- tilastossa": f"{worst_plusminus.get('firstName')} {worst_plusminus.get('lastName')} ({worst_plusminus.get('plusMinus')})"
        }

        for item in local_data.get('other_predictions', []):
            q_title = item.get('question', '')
            for key, val in player_updates.items():
                if key.lower() == q_title.lower() and val:
                    if item.get('current_leader') != val:
                        item['current_leader'] = val
                        updated = True

    return updated

def calculate_all_scores(local_data):
    players = local_data.get('players', [])
    match_points = {p: 0.0 for p in players}
    other_points = {p: 0.0 for p in players}

    # Ottelutulospisteet
    for match in local_data.get('matches', []):
        result = match.get('result')
        if result:
            for player, pred in match.get('predictions', {}).items():
                if pred == result and player in match_points:
                    match_points[player] += 1.0

    # Muut veikkaukset (3 p / 1 p ja peruspisteet)
    other_preds = local_data.get('other_predictions', [])
    medals, standings_top, relegated = {}, {}, {}

    for item in other_preds:
        q = item.get('question', '')
        leader = item.get('current_leader')
        if not leader: continue
        if q in ["KULTA", "HOPEA", "PRONSSI"]: medals[q] = leader
        elif q in ["RUNKOSARJA 1.", "RUNKOSARJA 2.", "RUNKOSARJA 3."]: standings_top[q] = leader
        elif "putoava" in q.lower(): relegated[q] = leader

    for item in other_preds:
        q = item.get('question', '')
        leader = item.get('current_leader')
        preds = item.get('predictions', {})
        if not leader: continue

        category_group = None
        if q in ["KULTA", "HOPEA", "PRONSSI"]: category_group = medals
        elif q in ["RUNKOSARJA 1.", "RUNKOSARJA 2.", "RUNKOSARJA 3."]: category_group = standings_top
        elif "putoava" in q.lower(): category_group = relegated

        if category_group:
            all_teams = list(category_group.values())
            exact_team = category_group.get(q)
            for player, pred in preds.items():
                if player in other_points:
                    if pred == exact_team:
                        other_points[player] += 3.0
                    elif pred in all_teams:
                        other_points[player] += 1.0
        else:
            for player, pred in preds.items():
                if player in other_points:
                    if str(pred).strip().lower() == str(leader).strip().lower():
                        other_points[player] += 1.0

    # Tallennettaan molemmat taulukot data.json-tiedostoon
    local_data['standings'] = [
        {"player": p, "points": pts} 
        for p, pts in sorted(match_points.items(), key=lambda x: x[1], reverse=True)
    ]
    
    total_predicted = {p: match_points[p] + other_points[p] for p in players}
    local_data['predicted_standings'] = [
        {"player": p, "points": pts} 
        for p, pts in sorted(total_predicted.items(), key=lambda x: x[1], reverse=True)
    ]

def fetch_and_update():
    try:
        with open('data.json', 'r', encoding='utf-8') as f:
            local_data = json.load(f)
    except FileNotFoundError:
        print("data.json ei löytynyt.")
        return

    # Ottelutulosten päivitys
    games = get_api_data("https://liiga.fi/api/v2/games?season=2026")
    if games:
        for match in local_data.get('matches', []):
            home, away = match.get('homeTeam'), match.get('awayTeam')
            for game in games:
                if game.get('homeTeam', {}).get('name') == home and game.get('awayTeam', {}).get('name') == away:
                    if game.get('started') or game.get('ended'):
                        h_goals = game.get('homeTeam', {}).get('goals', 0)
                        a_goals = game.get('awayTeam', {}).get('goals', 0)
                        match['result'] = "1" if h_goals > a_goals else ("2" if a_goals > h_goals else "X")
                    break

    update_other_predictions(local_data)
    calculate_all_scores(local_data)

    with open('data.json', 'w', encoding='utf-8') as f:
        json.dump(local_data, f, ensure_ascii=False, indent=2)
    print("Päivitys valmis ja data.json tallennettu!")

if __name__ == "__main__":
    fetch_and_update()
