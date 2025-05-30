class Filter {
    constructor(label, value) {
        this.label = label;
        this.value = value;
    }
}

class Table {
    constructor(data, updateInfocard, updateScatterplot, updateSelectedCircle) {
        this.data = data;
        this.filteredData = [...this.data];
        this.updateInfocard = updateInfocard;
        this.updateScatterplot = updateScatterplot;
        this.updateSelectedCircle = updateSelectedCircle;

        this.visWidth = 75;
        this.visHeight = 25;
        this.currentFilters = [];
        this.colKeys = ["PLAYER_NAME", "TEAM_ABBREVIATION", "PTS", "REB", "AST", "STL", "BLK", "TO"];
        this.visLabels = this.colKeys.slice(2);
        this.statColors = d3.scaleOrdinal()
            .domain(this.visLabels)
            .range(["#F8494C", "#FD843E", "#F9C74F", "#39804E", "#00CCFF", "#935FCE"]);

        this.headerData = this.makeHeaderData();

        this.attachSortHandlers();
        this.drawFilters();
        this.drawTable();
    }

    drawTable() {
        let data = this.filteredData;
        this.updateHeaders();
        let rows = d3.select("#table-body")
            .selectAll("tr")
            .data(data)
            .join("tr")
            .attr("class", "row")
            .attr("id", d => `row-${d.PLAYER_ID}`)

        let that = this;
        rows.on("click", function(d) {
            that.updateSelected(d);
            that.updateInfocard(d);
            that.updateSelectedCircle(d);
        });

        let tds = rows.selectAll("td")
            .data(this.getCellData)
            .join("td");

        tds.filter(d => !d.vis && !d.isType)
            .attr("width", d => d.stat == "PLAYER_NAME" ? "80" : "70")
            .text(d =>  d.val);

        let statsSelect = tds.filter(d => d.vis);
        this.makeStatsVis(statsSelect);
    }

    updateSelected(sel, scrollTo=false) {
        this.clearSelected();
        if(sel !== null) {
            d3.select(`#row-${sel.PLAYER_ID}`).classed("highlight", true);
            if(scrollTo) {
                let container = $('tbody');
                let scrollTo = $(`#row-${sel.PLAYER_ID}`);

                container.scrollTop(scrollTo.offset().top - container.offset().top + container.scrollTop() - 30);
            }
        }
    }

    clearSelected() {
        d3.selectAll(".row").classed("highlight", false);
    }

    getCellData(d) {
        let cells = [];
        let wordVals = ["PLAYER_NAME", "TEAM_ABBREVIATION"];
        wordVals.forEach(key => {
            if (key.includes("type")) {
                let statInfo = {
                    vis: false,
                    isType: true,
                    val: d[key]
                };
                cells.push(statInfo);
            }
            else {
                let statInfo = {
                    vis: false,
                    isType: false,
                    val: d[key],
                    stat: key,
                    isLegendary: d.is_legendary
                };
                cells.push(statInfo);
            }
        });

        let visVals = ["PTS", "REB", "AST", "STL", "BLK", "TO"];
        visVals.forEach(key => {
            let statInfo = {
                vis: true,
                isType: false,
                stat: key,
                type: d.type1,
                val: +d[key]
            };
            cells.push(statInfo);
        });

        return cells;
    }

    updateData(newData, isBrushed=false) {
        this.data = newData;
        if(!isBrushed) {
            this.updateCurrentFilters();
        }
        this.drawTable();
    }

    updateHeaders() {
        let colSel = d3.select("#headers");
        colSel.selectAll("th")
            .data(this.headerData)
            .classed("sorting", d => d.sorted);

        colSel.selectAll("i")
            .data(this.headerData)
            .classed('no-display', d => !d.sorted)
            .classed('fa-sort-up', d => d.ascending && d.sorted)
            .classed('fa-sort-down', d => !d.ascending && d.sorted);
    }

    attachSortHandlers() {
        d3.select("#headers")
            .selectAll("th")
            .data(this.headerData)
            .on("click", d => {
                let sortAsc = d.sorted ? !d.ascending : true;
                this.sortData(d.key, sortAsc, d.func);
                this.headerData.forEach(h => h.sorted = false);
                d.sorted = true;
                d.ascending = sortAsc;
                this.drawTable();
            });
    }

    sortData(key, isAsc, func) {
        this.filteredData.sort((a, b) => {
            let x = a[key];
            let y = b[key];

            if (!isAsc) {
                [x,y] = [y,x];
            }
            if (func) {
                x = func(x);
                y = func(y);
            }
            if (x < y) {
                return -1;
            }
            else if (x > y) {
                return 1;
            }
            return 0;
        });
        this.data.sort((a, b) => {
            let x = a[key];
            let y = b[key];

            if (!isAsc) {
                [x,y] = [y,x];
            }
            if (func) {
                x = func(x);
                y = func(y);
            }
            if (x < y) {
                return -1;
            }
            else if (x > y) {
                return 1;
            }
            return 0;
        });
    }

    makeHeaderData() {
        let headers = []
        let strings = this.colKeys.slice(1, 4);
        this.colKeys.forEach(k => {
            if (strings.includes(k)) {
                headers.push({
                    sorted: false,
                    ascending: false,
                    key: k
                });
            }
            else {
                headers.push({
                    sorted: false,
                    ascending: false,
                    key: k,
                    func: d => +d
                });
            }
        });


        return headers;
    }

    makeStatsVis(visSelection) {
        this.visLabels.forEach(stat => {
            let selection = visSelection.filter(d => d.stat === stat);
            let svg = selection.selectAll('svg')
                .data(d => [d])
                .join("svg")
                .attr("width", this.visWidth)
                .attr("height", this.visHeight);
            this.drawRects(svg);
        });
        
    }

    drawRects(selection) {
        let that = this;
        let tooltip = d3.select('#tool-tip')
            .classed("tooltip", true)
            .style("visibility", "hidden");

        selection.selectAll("rect")
            .data(d => [d])
            .join("rect")
            .attr("width", d => {
                let scale = d3.scaleLinear()
                    .domain([0, d3.max(this.data, data => data[d.stat])])
                    .range([0, this.visWidth]);
                return scale(d.val)
            })
            .attr("height", this.visHeight)
            .style("fill", d => this.statColors(d.stat))
            .on("mouseover", function(d) {
                tooltip.style("visibility", "visible")
                    .html(that.tooltipRender(d));
                d3.select(this)
                    .style("opacity", 0.5);
            })
            .on("mousemove", d => tooltip
                .style("left", (d3.event.pageX + 10) + "px")
                .style("top", (d3.event.pageY) + "px"))
            .on("mouseout", function(d) {
                tooltip.style("visibility", "hidden");
                d3.select(this)
                    .style("opacity", 1)
            });
    }

    drawFilters() {
        let filterSel = d3.select("#filters");

        let searchBar = d3.select("#search-bar");
        searchBar.on("keyup", () => {

            let searchVal = searchBar.property("value").toLowerCase();
            if (d3.event.keyCode === 13 || searchVal == "") {
                this.onSearchPlayer()
            }
            
        });

        // Add clear all button 
        let svg = d3.select("#clear")
            .append("svg")
            .attr("width", "100px")
            .attr("height", "30px")
            .attr("id", "clear-all-button")
            .on("click", () => this.clearAllFilters());

        svg.append("text")
            .attr("x", 11)
            .attr("y", 19)
            .text("Clear all")
            .style("font-size", "14pt")
            .style("fill", "black")
            .style("opacity", "100%")
            .style("padding", "5px")
        svg.append("image")
            .attr("href", "assets/x.png")
            .attr("height", "15px")
            .attr("width", "15px")
            .attr("x", "83px")
            .attr("y", "5px");
    }

    clearAllFilters() {
        // Clear current filters
        this.currentFilters = [];
        d3.select("#current-filters").selectAll("svg").remove();

        // Clear searchbar
        d3.select("#search-bar").property("value", "");

        // Clear sort headers
        this.sortData('PLAYER_ID', true, null);
        this.headerData.forEach(h => h.sorted = false);

        this.updateCurrentFilters()
        this.drawTable();
    }

    updateCurrentFilters() {
        this.filteredData = [...this.data];
        var f;
        for (f of this.currentFilters) {
            if (f.label == "search") {
                this.filteredData = this.filteredData.filter(d => d.PLAYER_NAME.toLowerCase().includes(f.value) || d.PLAYER_ID == f.value);
            }
        }
        this.updateScatterplot(this.filteredData);
    }

    onSearchPlayer() {
        let searchBar = d3.select("#search-bar");
        let searchVal = searchBar.property("value").toLowerCase();

        // Update current filters with searchbar value
        let searchIdx = this.currentFilters.findIndex(f => f.label == "search");
        if (searchIdx < 0) {
            let newFilter = new Filter("search", searchVal);
            this.currentFilters.push(newFilter)
        }
        else {
            this.currentFilters[searchIdx].value = searchVal;
        }
        this.updateCurrentFilters();
        this.drawTable();
    }
    tooltipRender(data) {
        let text = "<h2>" + data.stat.toUpperCase() + ": " + data.val + "</h2>";
        return text;
    }
    hasFilter(filter) {
        var f;
        for (f of this.currentFilters) {
            if (f.value instanceof Array && f.label == filter.label) {
                return true;
            }
            if (f.label == filter.label && f.value == filter.value) {
                return true;
            }
        }
        return false;
    }
}