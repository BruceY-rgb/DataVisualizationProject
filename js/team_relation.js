const urls = {
    // source: https://observablehq.com/@mbostock/u-s-airports-voronoi
    // source: https://github.com/topojson/us-atlas
    map: "data/team_relation/states-albers-10m.json",
  
    // source: https://gist.github.com/mbostock/7608400
    teams:
      "data/team_relation/Team_info.csv",
  
    // source: https://gist.github.com/mbostock/7608400
    games:
      "data/team_relation/games/games_regularseason_2020.csv",
}

const game_urls = {
  playoffs_2020 : "data/team_relation/games/games_playoffs_2020.csv",
  playoffs_2019 : "data/team_relation/games/games_playoffs_2019.csv",
  playoffs_2018 : "data/team_relation/games/games_playoffs_2018.csv",
  playoffs_2017 : "data/team_relation/games/games_playoffs_2017.csv",
  playoffs_2016 : "data/team_relation/games/games_playoffs_2016.csv",
  regularseason_2020 : "data/team_relation/games/games_regularseason_2020.csv",
  regularseason_2019 : "data/team_relation/games/games_regularseason_2019.csv",
  regularseason_2018 : "data/team_relation/games/games_regularseason_2018.csv",
  regularseason_2017 : "data/team_relation/games/games_regularseason_2017.csv",
  regularseason_2016 : "data/team_relation/games/games_regularseason_2016.csv",
}

const svg  = d3.select("svg");

const width  = parseInt(svg.attr("width"));
const height = parseInt(svg.attr("height"));
const hypotenuse = Math.sqrt(width * width + height * height);

// must be hard-coded to match our topojson projection
// source: https://github.com/topojson/us-atlas
const projection = d3.geoAlbers().scale(1280).translate([480, 300]);

const scales = {
  // used to scale airport bubbles
  teams: d3.scaleSqrt()
    .range([4, 18]),

  // used to scale number of segments per line
  segments: d3.scaleLinear()
    .domain([0, hypotenuse])
    .range([1, 10])
};

// have these already created for easier drawing
const g = {
  type: svg.select("g#types"),
  basemap:  svg.select("g#basemap"),
  games:  svg.select("g#games"),
  teams: svg.select("g#teams"),
  voronoi:  svg.select("g#voronoi")
};

// console.assert(g.basemap.size()  === 1);
// console.assert(g.games.size()  === 1);
// console.assert(g.teams.size() === 1);
// console.assert(g.voronoi.size()  === 1);

const tooltip = d3.select("text#tooltip");
// console.assert(tooltip.size() === 1);



d3.json(urls.map).then(drawMap);
drawtype();


const promises = [
  d3.csv(urls.teams, typeTeam),
  d3.csv(urls.games,  typeGame),
  
];

Promise.all(promises).then(function (loaded) {
  teams = loaded[0]
  games = loaded[1];
  

  processData(teams,games);
  // setupBanner();

});



// function remove(){
//   // d3.select("g#games").select("svg").remove();
//   // d3.select("g#teams").select("svg").remove();
//   // d3.select("g#voroni").select("svg").remove();
//   g.games.remove();
//   g.teams.remove();
//   g.voronoi.remove();
// }

  function processData(teams,dataset){
      
      let games = dataset;
      //console.log(teams)
      console.log("teams: " + teams.length);
      console.log("games: " + games.length);
      //console.log("gametype: " + games.type);
      //console.log("game1"+games[0])

      let team_name = new Map(teams.map(node => [node.team_name,node]))
      games.forEach(function(link) {
        link.source = team_name.get(link.team_1);
        link.target = team_name.get(link.team_2);
    
        link.source.outgoing += link.count;
        link.target.incoming += link.count;
      });
      //console.log(teams)
      drawTeams(teams);
      //console.log(teams)
      console.log("draw teams complete");
      drawPolygons(teams,games);
      console.log("draw polygons complete");
      console.log("start draw games");
      console.log(games)
      console.log("now")
      drawFlights(teams, games);

      // drawTest();
  }

  function Update_map(teams,dataset){
      
    let games = dataset;
    //console.log(teams)
    console.log("teams: " + teams.length);
    console.log("games: " + games.length);
    //console.log("gametype: " + games.type);
    //console.log("game1"+games[0])

    let team_name = new Map(teams.map(node => [node.team_name,node]))
    games.forEach(function(link) {
      link.source = team_name.get(link.team_1);
      link.target = team_name.get(link.team_2);
  
      link.source.outgoing += link.count;
      link.target.incoming += link.count;
    });
    //console.log(teams)
    update_teams(teams);
    //console.log(teams)
    console.log("draw teams complete");
    drawPolygons(teams,games);
    console.log("draw polygons complete");
    console.log("start draw games");
    // console.log(games)
    console.log("now")
    update_games(teams, games);

    // drawTest();
}


  function typeTeam(team) {
    team.longitude = parseFloat(team.longitude);
    team.latitude  = parseFloat(team.latitude);
  
    // use projection hard-coded to match topojson data
    const coords = projection([team.longitude, team.latitude]);
    team.x = coords[0];
    team.y = coords[1];
  
    team.outgoing = 0;  // eventually tracks number of outgoing flights
    team.incoming = 0;  // eventually tracks number of incoming flights
  
    team.games = [];  // eventually tracks outgoing flights
  
    return team;
  }

  function typeGame(game){
    game.count = parseInt(game.count);
    game.id = game.team_1+game.team_2;
    return game;
  }

  function drawtype(){

    let item1 = g.type.append("g")
    .attr("transform", "translate(0, 10)");;
        item1.append("line")
            .attr("x1", 0)
            .attr("x2", 25)
            .classed("highlights-win", true)
        item1.append("text")
            .text("Win Against")
            .attr("transform", "translate(30, 5)")

    let item2 = g.type.append("g")
        .attr("transform", "translate(0, 35)");
        item2.append("line")
            .attr("x1", 0)
            .attr("x2", 25)
            .classed("highlights-lose", true)
        item2.append("text")
            .text("Lose Against")
            .attr("transform", "translate(30, 5)")

    let item3 = g.type.append("g").attr("transform", "translate(0, 60)");
        item3.append("line")
            .attr("x1", 0)
            .attr("x2", 25)
            .classed("highlights-eq", true)
        item3.append("text")
            .text("Equal Against")
            .attr("transform", "translate(30, 5)")

  }

  // draws the underlying map
function drawMap(map) {
    // remove non-continental states
    // map.objects.states.geometries = map.objects.states.geometries.filter(isContinental);
  
    // run topojson on remaining states and adjust projection
    let land = topojson.merge(map, map.objects.states.geometries);
  
    // use null projection; data is already projected
    let path = d3.geoPath();
  
    // draw base map
    g.basemap.append("path")
      .datum(land)
      .attr("class", "land")
      .attr("d", path);
  
    // draw interior borders
    g.basemap.append("path")
      .datum(topojson.mesh(map, map.objects.states, (a, b) => a !== b))
      .attr("class", "border interior")
      .attr("d", path);
  
    // draw exterior borders
    g.basemap.append("path")
      .datum(topojson.mesh(map, map.objects.states, (a, b) => a === b))
      .attr("class", "border exterior")
      .attr("d", path);
  }

  function drawTeams(teams) {
    // adjust scale
    const extent = d3.extent(teams, d => d.outgoing);
    scales.teams.domain(extent);
  
    // draw airport bubbles
    g.teams.selectAll("circle.team")
      .data(teams, d => d.TEAM_ID)
      .enter()
      .append("circle")
      .attr("r",  d => scales.teams(d.outgoing))
      .attr("cx", d => d.x) // calculated on load
      .attr("cy", d => d.y) // calculated on load
      .attr("class", "team")
      .each(function(d) {
        // adds the circle object to our airport
        // makes it fast to select airports on hover
        d.bubble = this;
      });
  }

  function update_teams(teams) {
    // adjust scale
    const extent = d3.extent(teams, d => d.outgoing);
    scales.teams.domain(extent);
  
    // draw airport bubbles
    g.teams.selectAll("circle.team")
      .data(teams, d => d.TEAM_ID)
      ;
  }


  function drawPolygons(teams,games) {

    let id = new Map(games.map(node => [node.id, node]));
    // convert array of airports into geojson format
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
    // calculate voronoi polygons
  const polygons = d3.geoVoronoi().polygons(geojson);
  // console.log("polygon:"+polygons);

  g.voronoi.selectAll("path")
    .data(polygons.features)
    .enter()
    .append("path")
    .attr("d", d3.geoPath(projection))
    .attr("class", "voronoi")
    .on("mouseover", function(d) {
      let team = d.properties.site.properties;
      // console.log(team.games[0].data)
      //console.log(team.games[0].__data__[0].team_name)
      //console.log(team.games[0].__data__[team.games[0].__data__.length-1].team_name)

      // console.log(team.games[-1])

      d3.select(team.bubble)
        .classed("highlights", true);

      let links = d3.selectAll(team.games);
      // links.classed("highlight",true);
      // links.attr("class","highlight");
      // links.classed(d => {
      //       console.log(d)
      //       // const prepend = "type-line ";
      //       let cur_id = d[0].team_name+d[d.length-1].team_name;
      //       let cur = id.get(cur_id);
      //       console.log(cur.count);
      //       if(cur.count < 0)
      //           return "highlight";
      //       else if(cur.count = 0)
      //         return "highlight";
      //       else if(cur.count > 0)
      //           return "highlight";
      //       }, true);
      // console.log(links);
    
      links.attr("class", 
            d => {
            // console.log(d)
            // const prepend = "type-line ";
            let cur_id = d[0].team_name+d[d.length-1].team_name;
            let cur = id.get(cur_id);
            // console.log(typeof cur.count);
            // let t = parseInt(cur.count);
            // console.log(typeof t);

            if(cur.count < 0){
              // console.log("1");
              return "highlights-lose";}
            else if(cur.count > 0)
            {// console.log("2");
            return "highlights";}
            else 
            {// console.log("3");
            return "highlights-eq";}
            // return "highlight";
            }

            
        );
        // .raise();

      // make tooltip take up space but keep it invisible
      tooltip.style("display", null);
      tooltip.style("visibility", "hidden");

      // set default tooltip positioning
      tooltip.attr("text-anchor", "middle");
      tooltip.attr("dy", -scales.teams(team.outgoing) - 4);
      tooltip.attr("x", team.x);
      tooltip.attr("y", team.y);

      // set the tooltip text
      tooltip.text(team.city +" "+ team.nickname );

      // double check if the anchor needs to be changed
      let bbox = tooltip.node().getBBox();

      if (bbox.x <= 0) {
        tooltip.attr("text-anchor", "start");
      }
      else if (bbox.x + bbox.width >= width) {
        tooltip.attr("text-anchor", "end");
      }

      tooltip.style("visibility", "visible");
    })
    .on("mouseout", function(d) {
      let team = d.properties.site.properties;

      d3.select(team.bubble)
        .classed("highlights", false);

      d3.selectAll(team.games)
        .attr("class","game");

      d3.select("text#tooltip").style("visibility", "hidden");
    })
    .on("dblclick", function(d) {
      // toggle voronoi outline
      let toggle = d3.select(this).classed("highlight");
      d3.select(this).classed("highlights", !toggle);
    });
  }

  

  function drawTest(){
    test = 0
  }

  function drawFlights(teams, games) {
    // break each flight between airports into multiple segments
    // console.log("first")
    // console.log(teams)
    // console.log("before")
    let bundle = generateSegments(teams, games);
    // console.log(teams)
    console.log("generate complete");
    // https://github.com/d3/d3-shape#curveBundle
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
        // adds the path object to our source airport
        // makes it fast to select outgoing paths
        // console.log(d[0])
        d[0].games.push(this);
      });
      // https://github.com/d3/d3-force
    let layout = d3.forceSimulation()
    // settle at a layout faster
    .alphaDecay(0.1)
    // nearby nodes attract each other
    .force("charge", d3.forceManyBody()
     .strength(10)
     .distanceMax(scales.teams.range()[1] * 2)
    )
  // edges want to be as short as possible
  // prevents too much stretching
    .force("link", d3.forceLink()
      .strength(0.7)
      .distance(0)
    )
    .on("tick", function(d) {
      links.attr("d", line);
    })
    .on("end", function(d) {
      console.log("layout complete");
    });

layout.nodes(bundle.nodes).force("link").links(bundle.links);
}

function update_games(teams, games) {
  // break each flight between airports into multiple segments
  // console.log("first")
  // console.log(teams)
  // console.log("before")
  let bundle = generateSegments(teams, games);
  // console.log(teams)
  console.log("generate complete");
  // https://github.com/d3/d3-shape#curveBundle
  let line = d3.line()
  .curve(d3.curveBundle)
  .x(team=> team.x)
  .y(team=> team.y);

  let links = g.games.selectAll("path.game")
    .data(bundle.paths);
    // https://github.com/d3/d3-force
  let layout = d3.forceSimulation()
  // settle at a layout faster
  .alphaDecay(0.1)
  // nearby nodes attract each other
  .force("charge", d3.forceManyBody()
   .strength(10)
   .distanceMax(scales.teams.range()[1] * 2)
  )
// edges want to be as short as possible
// prevents too much stretching
  .force("link", d3.forceLink()
    .strength(0.7)
    .distance(0)
  )
  .on("tick", function(d) {
    links.attr("d", line);
  })
  .on("end", function(d) {
    console.log("layout complete");
  });

layout.nodes(bundle.nodes).force("link").links(bundle.links);
}


function generateSegments(nodes, links) {
  // generate separate graph for edge bundling
  // nodes: all nodes including control nodes
  // links: all individual segments (source to target)
  // paths: all segments combined into single path for drawing
  let bundle = {nodes: [], links: [], paths: []};
  // console.log(nodes);
  // console.log("hey!");
  // make existing nodes fixed
  bundle.nodes = nodes.map(function(d, i) {
    d.fx = d.x;
    d.fy = d.y;
    return d;
  });

  links.forEach(function(d, i) {
    // calculate the distance between the source and target
    let length = distance(d.source, d.target);

    // calculate total number of inner nodes for this link
    let total = Math.round(scales.segments(length));

    // create scales from source to target
    let xscale = d3.scaleLinear()
      .domain([0, total + 1]) // source, inner nodes, target
      .range([d.source.x, d.target.x]);

    let yscale = d3.scaleLinear()
      .domain([0, total + 1])
      .range([d.source.y, d.source.y]);

    // initialize source node
    let source = d.source;
    let target = null;

    // add all points to local path
    
    let local = [source];

    for (let j = 1; j <= total; j++) {
      // calculate target node
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

    // add last link to target node
    bundle.links.push({
      source: target,
      target: d.target
    });
    let local_f = [local,d.count];
    // console.log(local_f);
    bundle.paths.push(local);
  });
  // console.log("buncldes"+bundle.paths);
  return bundle;
  
}

function distance(source, target) {
  const dx2 = Math.pow(target.x - source.x, 2);
  const dy2 = Math.pow(target.y - source.y, 2);

  return Math.sqrt(dx2 + dy2);
}