import json
import urllib.request
import sys

def fetch_liiga_games():
    # Liigan julkinen API-päätepiste kauden otteluille
    url = "https://liiga.fi/api/v2/games"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    
    try:
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"Virhe haettaessa dataa Liigan APIsta: {e}")
        return []
    return []

def update_scores():
    # Ladataan nykyinen data.json
    try:
        with open('data.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print("Tiedostoa data.json ei löytynyt.")
        sys.exit(1)

    liiga_games = fetch_liiga_games()
    if not liiga_games:
        print("Ei saatu otteludataa Liigalta.")
        return

    updated_count = 0

    # Käydään läpi data.json-tiedostossa olevat ottelut
    for match in data.get('matches', []):
        # Jos tulos on jo syötetty, ei käsitellä sitä uudelleen
        if match.get('result') and str(match['result']).trim() != '':
            continue

        home_target = match.get('homeTeam', '').strip().lower()
        away_target = match.get('awayTeam', '').strip().lower()
        match_date = match.get('date', '').strip()

        # Etsitään vastaava ottelu Liigan datasta
        for game in liiga_games:
            game_home = game.get('homeTeam', {}).get('teamName', '').strip().lower()
            game_away = game.get('awayTeam', {}).get('teamName', '').strip().lower()
            
            # Tarkistetaan joukkueiden täsmäävyys ja että ottelu on päättynyt
            if home_target in game_home and away_target in game_away:
                if game.get('ended', False) or game.get('finished', False):
                    home_goals = game.get('homeTeam', {}).get('goals')
                    away_goals = game.get('awayTeam', {}).get('goals')
                    
                    if home_goals is not None and away_goals is not None:
                        # Muodostetaan tulosmuoto (esim. "1", "X" tai "2" tai maalitilanne "4-2")
                        if home_goals > away_goals:
                            res = "1"
                        elif away_goals > home_goals:
                            res = "2"
                        else:
                            res = "X"

                        match['result'] = res
                        updated_count += 1
                        print(f"Päivitetty ottelu {match['homeTeam']} vs {match['awayTeam']}: {res}")

    # Tallennetaan päivitetty data.json
    if updated_count > 0:
        with open('data.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Tiedosto data.json päivitetty! ({updated_count} uutta tulosta)")
    else:
        print("Ei uusia päivitettäviä tuloksia.")

if __name__ == "__main__":
    update_scores()
