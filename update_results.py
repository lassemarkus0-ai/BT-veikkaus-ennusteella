import json
import requests

def fetch_and_update():
    # 1. Lue nykyinen data.json
    try:
        with open('data.json', 'r', encoding='utf-8') as f:
            local_data = json.load(f)
    except FileNotFoundError:
        print("data.json-tiedostoa ei löytynyt.")
        return

    # 2. Hae tulokset Liigan API-rajapinnasta
    url = "https://liiga.fi/api/v2/games?season=2026"
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        api_games = response.json()
    except Exception as e:
        print(f"Virhe haettaessa Liigan API-dataa: {e}")
        return

    updated_count = 0

    # 3. Käydään läpi data.json ottelut
    for match in local_data.get('matches', []):
        home = match.get('homeTeam')
        away = match.get('awayTeam')
        
        for game in api_games:
            api_home = game.get('homeTeam', {}).get('name')
            api_away = game.get('awayTeam', {}).get('name')
            
            if api_home == home and api_away == away:
                is_started = game.get('started', False)
                is_ended = game.get('ended', False)
                
                # Käsitellään peli, jos se on alkanut tai jo päättynyt
                if is_started or is_ended:
                    home_goals = game.get('homeTeam', {}).get('goals', 0)
                    away_goals = game.get('awayTeam', {}).get('goals', 0)
                    
                    # Määritetään merkki: 1, 2 tai tasatilanteessa X
                    if home_goals > away_goals:
                        current_result = "1"
                    elif away_goals > home_goals:
                        current_result = "2"
                    else:
                        current_result = "X"
                    
                    # Päivitetään data.json vain jos merkki on muuttunut
                    if match.get('result') != current_result:
                        match['result'] = current_result
                        updated_count += 1
                        status_str = "LOPPUTULOS" if is_ended else "LIVE"
                        print(f"Päivitetty [{status_str}]: {home} {home_goals}-{away_goals} {away} -> {current_result}")
                    break

    # 4. Tallennetaan muuttunut data.json
    if updated_count > 0:
        with open('data.json', 'w', encoding='utf-8') as f:
            json.dump(local_data, f, ensure_ascii=False, indent=2)
        print(f"Päivitetty yhteensä {updated_count} ottelua.")
    else:
        print("Ei muutoksia tuloksissa.")

if __name__ == "__main__":
    fetch_and_update()
