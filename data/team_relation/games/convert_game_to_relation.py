import csv
from collections import defaultdict

input_file = 'game.csv'
output_file = 'games_regularseason_2024.csv'

# 全称到缩写映射
team_name_map = {
    "Atlanta Hawks": "ATL",
    "Boston Celtics": "BOS",
    "Brooklyn Nets": "BKN",
    "Charlotte Hornets": "CHA",
    "Chicago Bulls": "CHI",
    "Cleveland Cavaliers": "CLE",
    "Dallas Mavericks": "DAL",
    "Denver Nuggets": "DEN",
    "Detroit Pistons": "DET",
    "Golden State Warriors": "GSW",
    "Houston Rockets": "HOU",
    "Indiana Pacers": "IND",
    "Los Angeles Clippers": "LAC",
    "Los Angeles Lakers": "LAL",
    "Memphis Grizzlies": "MEM",
    "Miami Heat": "MIA",
    "Milwaukee Bucks": "MIL",
    "Minnesota Timberwolves": "MIN",
    "New Orleans Pelicans": "NOP",
    "New York Knicks": "NYK",
    "Oklahoma City Thunder": "OKC",
    "Orlando Magic": "ORL",
    "Philadelphia 76ers": "PHI",
    "Phoenix Suns": "PHX",
    "Portland Trail Blazers": "POR",
    "Sacramento Kings": "SAC",
    "San Antonio Spurs": "SAS",
    "Toronto Raptors": "TOR",
    "Utah Jazz": "UTA",
    "Washington Wizards": "WAS"
}

teams = set()
relation = defaultdict(lambda: defaultdict(int))

with open(input_file, encoding='utf-8') as f:
    reader = csv.reader(f)
    header = next(reader)
    idx_visitor = header.index('Visitor/Neutral')
    idx_home = header.index('Home/Neutral')
    idx_pts_visitor = header.index('PTS')
    idx_pts_home = [i for i, h in enumerate(header) if h == 'PTS'][1]

    for row in reader:
        team1_full = row[idx_visitor].strip()
        team2_full = row[idx_home].strip()
        # 跳过未收录的球队
        if team1_full not in team_name_map or team2_full not in team_name_map:
            continue
        team1 = team_name_map[team1_full]
        team2 = team_name_map[team2_full]
        try:
            pts1 = int(row[idx_pts_visitor])
            pts2 = int(row[idx_pts_home])
        except:
            continue
        teams.add(team1)
        teams.add(team2)
        if pts1 > pts2:
            relation[team1][team2] += 1
            relation[team2][team1] -= 1
        elif pts1 < pts2:
            relation[team2][team1] += 1
            relation[team1][team2] -= 1

teams = sorted(teams)

with open(output_file, 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(['team_1', 'team_2', 'count'])
    for t1 in teams:
        for t2 in teams:
            count = relation[t1][t2] if t2 in relation[t1] else 0
            writer.writerow([t1, t2, count])

print(f'输出完成：{output_file}')