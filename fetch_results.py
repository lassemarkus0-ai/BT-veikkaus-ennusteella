import json
import urllib.request
import sys

def fetch_liiga_games():
    # Haetaan kuluvan kauden ottelut Liigan APIsta
    url = "https://liiga.fi/api/v2/games?season=2026"
    req = urllib.request.Request(
        url, 
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                data = json.loads(response.read().decode('utf-8'))
                # API voi palauttaa listan tai olion, jossa 'games'
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
    print(f"Haettiin Liigan APIsta {len(liiga_games)} ottelua.")

    if not liiga_games:
        print("Ei saatu otteludataa Liigalta.")
        return

    updated_count = 0

    for match in data.get('matches', []):
        # Tarkistetaan onko tulos jo syötetty (sallitaan tyhjät kentät)
        current_res = str(match.get('result', '') or '').strip()
        if current_res != '' and current_res != '-':
            continue

        home_target = str(match.get('homeTeam', '')).strip().lower()
        away_target = str(match.get('awayTeam', '')).strip().lower()

        for game in liiga_games:
            # Kaivetaan joukkueiden nimet eri mahdollisista API-muodoista
            g_home = str(game.get('homeTeam', {}).get('teamName') or game.get('homeTeam', '')).strip().lower()
            g_away = str(game.get('awayTeam', {}).get('teamName') or game.get('awayTeam', '')).strip().lower()

            # Tarkistetaan löytyykö vastaava pari
            if (home_target in g_home or g_home in home_target) and (away_target in g_away or g_away in away_target):
                is_ended = game.get('ended', False) or game.get('finished', False) or game.get('gameEnded', False)
                
                # Jos peli on päättynyt
                if is_ended:
                    home_goals = game.get('homeTeam', {}).get('goals')
                    away_goals = game.get('awayTeam', {}).get('goals')

                    if home_goals is not None and away_goals is not None:
                        if home_goals > away_goals:
                            res = "1"
                        elif away_goals > home_goals:
                            res = "2"
                        else:
                            res = "X"

                        match['result'] = res
                        updated_count += 1
                        print(f"Päivitetty: {match['homeTeam']} vs {match['awayTeam']} -> {res}")
                        break

    if updated_count > 0:
        with open('data.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Päivitetty {updated_count} uutta tulosta tiedostoon data.json.")
    else:
        print("Ei uusia päivitettäviä tuloksia (varmista että ottelut ovat jo päättyneet Liigan sivuilla).")

if __name__ == "__main__":
    update_scores()
