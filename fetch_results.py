import json
import urllib.request
import sys
from datetime import datetime

def fetch_liiga_games():
    # Syksyllä 2026 alkava kausi 2026-2027 on Liigan APIssa '2027'
    url = "https://liiga.fi/api/v2/games?season=2027"
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

def parse_date(date_str):
    """ Muuntaa "01.09.2026 18.30" muotoon YYYY-MM-DD """
    try:
        dt = datetime.strptime(date_str.strip(), "%d.%m.%Y %H.%M")
        return dt.strftime("%Y-%m-%d")
    except Exception:
        return None

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
        current_res = str(match.get('result', '') or '').strip()
        
        # Päivitetään vain tyhjät tulokset
        if current_res != '' and current_res != '-':
            continue

        home_target = str(match.get('homeTeam', '')).strip().lower()
        away_target = str(match.get('awayTeam', '')).strip().lower()
        match_date = parse_date(match.get('date', ''))

        for game in liiga_games:
            g_home = str(game.get('homeTeam', {}).get('teamName') or game.get('homeTeam', '')).strip().lower()
            g_away = str(game.get('awayTeam', {}).get('teamName') or game.get('awayTeam', '')).strip().lower()
            
            # Liigan APIn päivämäärä (start / date)
            g_start = game.get('start') or game.get('date') or ''
            g_date = g_start.split('T')[0] if 'T' in g_start else g_start[:10]

            # Varmistetaan että SEKÄ joukkueet ETTEI päivämäärä täsmää
            if (home_target in g_home or g_home in home_target) and \
               (away_target in g_away or g_away in away_target) and \
               (match_date == g_date if match_date else True):
                
                is_ended = game.get('ended', False) or game.get('finished', False) or game.get('gameEnded', False)
                
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
                        print(f"Päivitetty: {match['homeTeam']} vs {match['awayTeam']} ({match_date}) -> {res}")
                        break

    if updated_count > 0:
        with open('data.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Päivitetty {updated_count} uutta tulosta tiedostoon data.json.")
    else:
        print("Ei uusia päivitettäviä tuloksia.")

if __name__ == "__main__":
    update_scores()
