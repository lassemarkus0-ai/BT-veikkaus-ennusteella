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
    """ Muuntaa erilaiset päivämäärämuodot muotoon YYYY-MM-DD """
    if not date_str:
        return None
    
    date_str = str(date_str).strip()
    
    # Yritetään eri formaatteja
    formats = [
        "%d.%m.%Y %H.%M",
        "%d.%m.%Y %H:%M",
        "%d.%m.%Y",
        "%Y-%m-%d",
        "%Y-%m-%dT%H:%M:%S"
    ]
    
    for fmt in formats:
        try:
            dt = datetime.strptime(date_str, fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue
            
    # Jos sisältää T-kirjaimen (ISO-formaatti)
    if 'T' in date_str:
        return date_str.split('T')[0]
        
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
    matches = data.get('matches', [])
    print(f"data.json sisältää {len(matches)} ottelua.")

    for match in matches:
        current_res = str(match.get('result', '') or '').strip()
        
        # Päivitetään vain tyhjät tai '0'-/'-'-tulokset
        if current_res not in ['', '-', '0', 'None']:
            continue

        home_target = str(match.get('homeTeam', '')).strip().lower()
        away_target = str(match.get('awayTeam', '')).strip().lower()
        match_date = parse_date(match.get('date', ''))

        for game in liiga_games:
            # Kaivetaan kotijoukkueen nimi
            g_home_obj = game.get('homeTeam', {})
            if isinstance(g_home_obj, dict):
                g_home = str(g_home_obj.get('teamName') or g_home_obj.get('name') or '').strip().lower()
            else:
                g_home = str(g_home_obj).strip().lower()

            # Kaivetaan vierasjoukkueen nimi
            g_away_obj = game.get('awayTeam', {})
            if isinstance(g_away_obj, dict):
                g_away = str(g_away_obj.get('teamName') or g_away_obj.get('name') or '').strip().lower()
            else:
                g_away = str(g_away_obj).strip().lower()
            
            # Liigan APIn päivämäärä
            g_start = game.get('start') or game.get('date') or ''
            g_date = parse_date(g_start)

            # Joukkueiden nimitarkistus (kumpaankin suuntaan osittainen täsmäys)
            home_match = (home_target in g_home) or (g_home in home_target)
            away_match = (away_target in g_away) or (g_away in away_target)
            date_match = (match_date == g_date) if (match_date and g_date) else True

            if home_match and away_match and date_match:
                # Tarkistetaan onko ottelu päättynyt
                game_status = str(game.get('gameStatus', '')).upper()
                is_ended = (
                    game.get('ended') is True or 
                    game.get('finished') is True or 
                    game.get('gameEnded') is True or
                    game_status in ['ENDED', 'FINISHED', 'COMPLETED']
                )
                
                if is_ended:
                    home_goals = game.get('homeTeam', {}).get('goals') if isinstance(g_home_obj, dict) else None
                    away_goals = game.get('awayTeam', {}).get('goals') if isinstance(g_away_obj, dict) else None

                    if home_goals is not None and away_goals is not None:
                        if home_goals > away_goals:
                            res = "1"
                        elif away_goals > home_goals:
                            res = "2"
                        else:
                            res = "X"

                        match['result'] = res
                        updated_count += 1
                        print(f"PÄIVITETTY: {match.get('homeTeam')} vs {match.get('awayTeam')} ({match_date}) -> {res} (Maalit: {home_goals}-{away_goals})")
                        break
                else:
                    # Ottelu löytyi, mutta se ei ole vielä päättynyt
                    pass

    if updated_count > 0:
        with open('data.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Tallennettiin {updated_count} uutta tulosta tiedostoon data.json.")
    else:
        print("Ei uusia päivitettäviä tuloksia.")

if __name__ == "__main__":
    update_scores()
