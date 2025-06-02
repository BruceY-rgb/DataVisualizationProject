let table, scatterplot, infocard;

// 球队数据路径映射
const teamDataMap = {
    'ATL': './data/teams/ATL_2025.json',
    'BOS': './data/teams/BOS_2025.json',
    'BKN': './data/teams/BKN_2025.json',
    'CHA': './data/teams/CHA_2025.json',
    'CHI': './data/teams/CHI_2025.json',
    'CLE': './data/teams/CLE_2025.json',
    'DAL': './data/teams/DAL_2025.json',
    'DEN': './data/teams/DEN_2025.json',
    'DET': './data/teams/DET_2025.json',
    'GSW': './data/teams/GSW_2025.json',
    'HOU': './data/teams/HOU_2025.json',
    'IND': './data/teams/IND_2025.json',
    'LAC': './data/teams/LAC_2025.json',
    'LAL': './data/teams/LAL_2025.json',
    'MEM': './data/teams/MEM_2025.json',
    'MIA': './data/teams/MIA_2025.json',
    'MIL': './data/teams/MIL_2025.json',
    'MIN': './data/teams/MIN_2025.json',
    'NOP': './data/teams/NOP_2025.json',
    'NYK': './data/teams/NYK_2025.json',
    'OKC': './data/teams/OKC_2025.json',
    'ORL': './data/teams/ORL_2025.json',
    'PHI': './data/teams/PHI_2025.json',
    'PHX': './data/teams/PHX_2025.json',
    'POR': './data/teams/POR_2025.json',
    'SAC': './data/teams/SAC_2025.json',
    'SAS': './data/teams/SAS_2025.json',
    'TOR': './data/teams/TOR_2025.json',
    'UTA': './data/teams/UTA_2025.json',
    'WAS': './data/teams/WAS_2025.json',
    'ALL': './data/teams/ALL_2025.json'
};

// 页面加载后初始化
document.addEventListener('DOMContentLoaded', function () {
    const teamSelector = document.getElementById('team-selector');
    const defaultTeam = teamSelector.value; // 默认选中第一个球队
    loadAndRenderTeamData(defaultTeam);

    // 监听球队选择变化
    teamSelector.addEventListener('change', function () {
        const selectedTeam = this.value;
        loadAndRenderTeamData(selectedTeam);
    });
});

// 加载并渲染球队数据
function loadAndRenderTeamData(teamAbbr) {
    const datasetPath = teamDataMap[teamAbbr];
    if (!datasetPath) {
        console.error(`No data path for ${teamAbbr}`);
        return;
    }

    d3.json(datasetPath).then(function (data) {
        if (!data || !Array.isArray(data) || data.length === 0) {
            console.error(`No data loaded for ${teamAbbr}`);
            return;
        }
        // 初始化对象只做一次
        if (!table || !scatterplot || !infocard) {
            table = new Table(data, updateInfocard, updateScatterplot, updateSelectedCircle);
            scatterplot = new Scatterplot(data, updateInfocard, updateSelectedRow);
            infocard = new Infocard(data[0], updateSelectedCircle, updateSelectedRow);
        } else {
            table.updateData(data);
            scatterplot.updateData(data);
            infocard.updateSelected(data[0]);
        }
        // 默认选中第一个球员
        table.updateSelected(data[0]);
        scatterplot.updateSelected(data[0]);
    }).catch(function (error) {
        console.error(`Load ${teamAbbr} with error:`, error);
    });
}

// 回调函数定义
function updateInfocard(data) {
    infocard.updateSelected(data);
}
function updateSelectedRow(data, scrollTo = false) {
    table.updateSelected(data, scrollTo);
}
function updateScatterplot(data) {
    scatterplot.updateData(data);
}
function updateSelectedCircle(data) {
    scatterplot.updateSelected(data);
}