import json
import urllib.request
import sys

def fetch_liiga_games():
    url = "https://liiga.fi/api/v2/games?season=2026"
    req = urllib.request.Request(
        url, 
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                data = json.loads(response.read().decode('utf-8'))
                if isinstance(data, dict):
                    return data.get('games', [])
                return data
    except Exception as e:
        print(f"Virhe haettaessa dataa Liigan APIsta: {e}")
        return []
    return []

def update_scores():
    try:
        with open('data.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Tiedoston data.json luku epäonnistui: {e}")
        sys.exit(1)

    liiga_games = fetch_liiga_games()
    if not liiga_games:
        print("Ei saatu otteludataa Liigalta.")
        return

    updated_count = 0

    for match in data.get('matches', []):
        home_target = str(match.get('homeTeam', '')).strip().lower()
        away_target = str(match.get('awayTeam', '')).strip().lower()

        for game in liiga_games:
            g_home = str(game.get('homeTeam', {}).get('teamName') or game.get('homeTeam', '')).strip().lower()
            g_away = str(game.get('awayTeam', {}).get('teamName') or game.get('awayTeam', '')).strip().lower()

            if (home_target in g_home or g_home in home_target) and (away_target in g_away or g_away in away_target):
                is_ended = game.get('ended', False) or game.get('finished', False) or game.get('gameEnded', False)
                
                if is_ended:
                    home_goals = game.get('homeTeam', {}).get('goals')
                    away_goals = game.get('awayTeam', {}).get('goals')

                    if home_goals is not None and away_goals is not None:
                        if home_goals > away_goals:
                            res_sign = "1"
                        elif away_goals > home_goals:
                            res_sign = "2"
                        else:
                            res_sign = "X"

                        # Syötetään tulos useammassa muodossa yhteensopivuuden varmistamiseksi
                        match['result'] = res_sign
                        match['score'] = f"{home_goals}-{away_goals}"
                        match['homeGoals'] = home_goals
                        match['awayGoals'] = away_goals
                        
                        updated_count += 1
                        break

    with open('data.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Päivitetty data.json valmis. Päivityksiä kohdistui {updated_count} otteluun.")

if __name__ == "__main__":
    update_scores()
