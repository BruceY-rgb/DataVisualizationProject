class Infocard {
    constructor(selected, updateSelectedCircle, updateSelectedRow) {
        this.selected = null;
        this.updateSelectedCircle = updateSelectedCircle;
        this.updateSelectedRow = updateSelectedRow;

        this.hpScale = d3.scaleLinear()
            .domain([0, 255]).range([0, 100]).nice()
        this.atkScale = d3.scaleLinear()
            .domain([0, 185]).range([0, 100]).nice()
        this.defScale = d3.scaleLinear()
            .domain([0, 230]).range([0, 100]).nice()
        this.spdScale = d3.scaleLinear()
            .domain([0, 180]).range([0, 100]).nice()
        this.spAtkScale = d3.scaleLinear()
            .domain([0, 194]).range([0, 100]).nice()
        this.spDefScale = d3.scaleLinear()
            .domain([0, 230]).range([0, 100]).nice()

        this.updateSelected(selected);
    }

    updateSelected(data) {
        this.selected = data;

        let body = d3.select(".item-infocard");
        body.select("#bg_color").attr("class", `stats-player-summary team-color ${data.TEAM_ABBREVIATION}`)
        body.select("#team_background_logo").attr("src", `https://cdn.nba.com/logos/nba/${data.TEAM_ID}/global/D/logo.svg`)
        body.select("#team_background_logo").attr("abbr", `${data.TEAM_ABBREVIATION}`)
        body.select("#team_logo").attr("src", `https://cdn.nba.com/logos/nba/${data.TEAM_ID}/global/D/logo.svg`)
        body.select("#team_logo").attr("abbr", `${data.TEAM_ABBREVIATION}`)
        body.select("#player_logo").attr("src", `https://cdn.nba.com/headshots/nba/latest/260x190/${data.PLAYER_ID}.png`)
        body.select("#team_name").text(` ${data.TEAM_ABBREVIATION}`);
        body.select("#myname").text(` ${data.PLAYER_NAME ? data.PLAYER_NAME : '?'} `);

        body.select("#PTS").text(` ${data.PTS ? data.PTS : '?'} `);
        body.select("#REB").text(` ${data.REB ? data.REB : '?'} `);
        body.select("#AST").text(` ${data.AST ? data.AST : '?'} `);
        body.select("#BLK").text(` ${data.BLK ? data.BLK : '?'}`);
        body.select("#TO").text(` ${data.TO ? data.TO : '?'}`);
        body.select("#plus_minus").text(` ${data.PLUS_MINUS ? data.PLUS_MINUS : '?'}`);
    }
}

