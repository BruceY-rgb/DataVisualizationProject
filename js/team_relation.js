const urls = {
  map: "data/team_relation/states-albers-10m.json",
  teams:"data/team_relation/Team_info.csv", 
  games: "data/team_relation/games/games_regularseason_2024.csv",
}

const svg  = d3.select("svg");
const width  = parseInt(svg.attr("width"));
const height = parseInt(svg.attr("height"));
const hypotenuse = Math.sqrt(width * width + height * height);

const projection = d3.geoAlbers().scale(1280).translate([480, 300]);//地图投影

const scales = {
  //球队圆圈大小
  teams: d3.scaleSqrt().range([4, 18]),
  //连线分段数
  segments: d3.scaleLinear().domain([0, hypotenuse]).range([1, 10])
};

//图层
const g = {
  type: svg.select("g#types"),//图例
  basemap:  svg.select("g#basemap"),//底图
  games:  svg.select("g#games"),//连线
  teams: svg.select("g#teams"),//球队圆圈
  voronoi:  svg.select("g#voronoi")//球队势力范围
};
const tooltip = d3.select("text#tooltip");//球队信息提示框

//绘制地图
d3.json(urls.map).then(drawMap);
drawtype();

//加载球队数据
const promises = [
  d3.csv(urls.teams, typeTeam),
  d3.csv(urls.games,  typeGame),
  
];
Promise.all(promises).then(function (loaded) {
  teams = loaded[0]
  games = loaded[1];
  processData(teams,games);
});

//数据处理，结合球队和比赛数据
function processData(teams,games){

  let team_name = new Map(teams.map(node => [node.team_name,node]))
  //根据胜负关系表示出度和入度
  games.forEach(function(link) {
    link.source = team_name.get(link.team_1);
    link.target = team_name.get(link.team_2);

    link.source.outgoing += link.count;
    link.target.incoming += link.count;
  });
  
  drawTeams(teams);
  drawPolygons(teams,games);
  drawFlights(teams, games);

}

function typeTeam(team) {
  team.longitude = parseFloat(team.longitude);
  team.latitude  = parseFloat(team.latitude);

  const coords = projection([team.longitude, team.latitude]);
  team.x = coords[0];
  team.y = coords[1];

  team.outgoing = 0;  
  team.incoming = 0; 

  team.games = [];

  return team;
}

function typeGame(game){
  game.count = parseInt(game.count);
  game.id = game.team_1+game.team_2;
  return game;
}

  //图例绘制
function drawtype(){

  let item1 = g.type.append("g")
  .attr("transform", "translate(0, 10)");;
      item1.append("line")
          .attr("x1", 0)
          .attr("x2", 40)
          .classed("highlights-win", true)
      item1.append("text")
          .text("胜")
          .attr("transform", "translate(45, 5)")

  let item2 = g.type.append("g")
      .attr("transform", "translate(0, 35)");
      item2.append("line")
          .attr("x1", 0)
          .attr("x2", 40)
          .classed("highlights-lose", true)
      item2.append("text")
          .text("负")
          .attr("transform", "translate(45, 5)")

  let item3 = g.type.append("g").attr("transform", "translate(0, 60)");
      item3.append("line")
          .attr("x1", 0)
          .attr("x2", 40)
          .classed("highlights-eq", true)
      item3.append("text")
          .text("平")
          .attr("transform", "translate(45, 5)")

}

  //绘制地图
function drawMap(map) {
  let land = topojson.merge(map, map.objects.states.geometries);

  let path = d3.geoPath();

  g.basemap.append("path")
    .datum(land)
    .attr("class", "land")
    .attr("d", path);

  g.basemap.append("path")
    .datum(topojson.mesh(map, map.objects.states, (a, b) => a !== b))
    .attr("class", "border interior")
    .attr("d", path);

  g.basemap.append("path")
    .datum(topojson.mesh(map, map.objects.states, (a, b) => a === b))
    .attr("class", "border exterior")
    .attr("d", path);
}

 // 绘制球队圆圈
function drawTeams(teams) {
  const extent = d3.extent(teams, d => d.outgoing);
  scales.teams.domain(extent);

  g.teams.selectAll("circle.team")
    .data(teams, d => d.TEAM_ID)
    .enter()
    .append("circle")
    .attr("r",  d => scales.teams(d.outgoing))
    .attr("cx", d => d.x) 
    .attr("cy", d => d.y) 
    .attr("class", "team")
    .each(function(d) {
      d.bubble = this;
    });

}

//球队势力范围
function drawPolygons(teams,games) {

  let id = new Map(games.map(node => [node.id, node]));

  const geojson = teams.map(function(team) {
    return {
      type: "Feature",
      properties: team,
      geometry: {
        type: "Point",
        coordinates: [team.longitude, team.latitude]
      }
    };
  });
  const polygons = d3.geoVoronoi().polygons(geojson);

  g.voronoi.selectAll("path")
    .data(polygons.features)
    .enter()
    .append("path")
    .attr("d", d3.geoPath(projection))
    .attr("class", "voronoi")
    .on("mouseover", function(d) {//鼠标悬停，显示球队信息和比赛连线
      let team = d.properties.site.properties;
      d3.select(team.bubble)
        .classed("highlights", true);

      let links = d3.selectAll(team.games);

      links.attr("class", 
            d => {
            let cur_id = d[0].team_name+d[d.length-1].team_name;
            let cur = id.get(cur_id);
            if(cur.count < 0){
              return "highlights-lose";}
            else if(cur.count > 0)
            {
            return "highlights-win";}
            else 
            {
            return "highlights-eq";}
            
            }          
        );
      
      showInfo(team);
      
    })
    .on("mouseout", function(d) {
      let team = d.properties.site.properties;

      d3.select(team.bubble)
        .classed("highlights", false);

      d3.selectAll(team.games)
        .attr("class","game");

      d3.select("text#tooltip").style("visibility", "hidden");
    });
}

//显示球队信息
function showInfo(team) {
  tooltip.style("display", null);
  tooltip.style("visibility", "hidden");
  tooltip.attr("text-anchor", "middle");
  tooltip.attr("dy", -scales.teams(team.outgoing) - 4);
  tooltip.attr("x", team.x);
  tooltip.attr("y", team.y);
  tooltip.text(team.city + " " + team.nickname);
  tooltip.style("visibility", "visible");
}

//绘制比赛连线
function drawFlights(teams, games) {
  let bundle = generateSegments(teams, games);

  let line = d3.line()
    .curve(d3.curveBundle)
    .x(team=> team.x)
    .y(team=> team.y);

  let links = g.games.selectAll("path.game")
      .data(bundle.paths)
      .enter()
      .append("path")
      .attr("d", line)
      .attr("class", "game")
      .each(function(d) {
        d[0].games.push(this);
      });
  let layout = d3.forceSimulation()
      .alphaDecay(0.1)
      .force("charge", d3.forceManyBody()
      .strength(10)
      .distanceMax(scales.teams.range()[1] * 2)
    )
    .force("link", d3.forceLink()
      .strength(0.7)
      .distance(0)
    )
    .on("tick", function(d) {
      links.attr("d", line);
    });

  layout.nodes(bundle.nodes).force("link").links(bundle.links);
}

//连线平滑处理
function generateSegments(nodes, links) {
  let bundle = {nodes: [], links: [], paths: []};
  bundle.nodes = nodes.map(function(d, i) {
    d.fx = d.x;
    d.fy = d.y;
    return d;
  });

  links.forEach(function(d, i) {
    let length = distance(d.source, d.target);

    let total = Math.round(scales.segments(length));

    let xscale = d3.scaleLinear()
      .domain([0, total + 1]) 
      .range([d.source.x, d.target.x]);

    let yscale = d3.scaleLinear()
      .domain([0, total + 1])
      .range([d.source.y, d.source.y]);

    let source = d.source;
    let target = null;

    let local = [source];

    for (let j = 1; j <= total; j++) {
      target = {
        x: xscale(j),
        y: yscale(j)
      };

      local.push(target);
      bundle.nodes.push(target);

      bundle.links.push({
        source: source,
        target: target
      });

      source = target;
    }

    local.push(d.target);

    bundle.links.push({
      source: target,
      target: d.target
    });
    let local_f = [local,d.count];
    bundle.paths.push(local);
  });
  return bundle;
  
}

function distance(source, target) {
  const dx2 = Math.pow(target.x - source.x, 2);
  const dy2 = Math.pow(target.y - source.y, 2);

  return Math.sqrt(dx2 + dy2);
}
