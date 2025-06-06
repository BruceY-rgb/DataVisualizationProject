class Scatterplot {
    constructor(data, updateInfocard, updateSelectedRow) {
        this.allData = data;
        this.data = data;
        this.updateInfocard = updateInfocard;
        this.updateSelectedRow = updateSelectedRow;
  
        this.margin = 25;
        this.height = 500;
        this.width = 700;

        this.indicators = [{
                indicator: "PTS",
                label: "PPG"
            },
            {
                indicator: "REB",
                label: "RPG"
            },
            {
                indicator: "AST",
                label: "AST"
            },    {
                indicator: "BLK",
                label: "BLK"
            },
            {
                indicator: "STL",
                label: "STL"
            },
            {
                indicator: "TO",
                label: "TO"
            }];

        this.xIndicator = "PTS";
        this.yIndicator = "REB";
        this.circleSizeIndicator = "AST";

        this.drawPlot();
        this.updatePlot(this.data, this.xIndicator, this.yIndicator, this.circleSizeIndicator);
    }

    drawPlot() {
        // Borrowed from HW4 - START
        d3.select('.item-scatterplot')
            .append('div').attr('id', 'chart-view')
            .on("mousedown", () => {
                this.clearSelected();
                this.updateSelectedRow(null);
            });
    
        d3.select('#chart-view')
            .append('div')
            .attr("class", "chart-tooltip")
            .style("opacity", 0);
    
        d3.select('#chart-view')
            .append('svg').classed('plot-svg', true)
            .attr("width", this.width + this.margin + this.margin)
            .attr("height", this.height + this.margin + this.margin);
        
        let svgGroup = d3.select('#chart-view').select('.plot-svg').append('g').classed('wrapper-group', true);

        svgGroup.append('g')
            .classed("axis", true)
            .attr('id', 'x-axis')
            .attr("transform", `translate(0, ${this.height})`)
            .append("text").text('')
            .classed("axis-label", true)
            .attr("transform", `translate(${this.width/2}, 35)`)
            .attr("text-align", "center");

        svgGroup.append('g')
            .classed("axis", true)
            .attr('id', 'y-axis')
            .attr("transform", `translate(${this.margin * 2}, 0)`)
            .append("text").text('')
            .classed("axis-label", true)
            .attr("transform", `translate(-35, ${this.height/2}) rotate(270)`)
            .attr("text-align", "center");

        svgGroup.append('g')
            .attr('id', 'scatterplot');

        // Dropdown menu setup
        let dropdownWrap = d3.select('#chart-view').append('div').classed('dropdown-wrapper', true);

        let xWrap = dropdownWrap.append('div').classed('dropdown-panel', true);

        xWrap.append('div').classed('x-label', true)
            .append('text')
            .text('X Axis Data:');

        xWrap.append('div').attr('id', 'dropdown_x').classed('dropdown', true).append('div').classed('dropdown-content', true)
            .append('select');

        let yWrap = dropdownWrap.append('div').classed('dropdown-panel', true);

        yWrap.append('div').classed('y-label', true)
            .append('text')
            .text('Y Axis Data:');

        yWrap.append('div').attr('id', 'dropdown_y').classed('dropdown', true).append('div').classed('dropdown-content', true)
            .append('select');

        let cWrap = dropdownWrap.append('div').classed('dropdown-panel', true);

        cWrap.append('div').classed('c-label', true)
            .append('text')
            .text('Circle Size: ');

        cWrap.append('div').attr('id', 'dropdown_c').classed('dropdown', true).append('div').classed('dropdown-content', true)
            .append('select');

        d3.select('#chart-view')
            .append('div')
            .classed('circle-legend', true)
            .append('svg')
            .append('g')
            .attr('transform', 'translate(10, 0)');

        // Borrow from HW 4 - END
    }

    updateSelected(selected) {
        this.clearSelected();
        d3.select(".plot-svg").selectAll("circle").classed("blurred", true);
        d3.select(`#circle-${selected.PLAYER_ID}`)
            .classed("blurred", false)
            .classed("selected", true);
    }

    updatePlot(data, xIndicator, yIndicator, circleSizeIndicator) {
    this.xIndicator = xIndicator;
    this.yIndicator = yIndicator;
    this.circleSizeIndicator = circleSizeIndicator;
    this.data = data;

    // 更新比例尺域范围
    this.xScale = d3.scaleLinear()
        .domain([0, d3.max(this.allData, d => d[xIndicator])])
        .range([this.margin * 2, this.width])

    this.yScale = d3.scaleLinear()
        .domain([0, d3.max(this.allData, d => d[yIndicator])])
        .range([this.height, this.margin*2])

    const circleMin = d3.min(this.allData, d => d[circleSizeIndicator]);
    const circleMax = d3.max(this.allData, d => d[circleSizeIndicator]);
    this.circleScale = d3.scaleLinear()
        .domain([circleMin, circleMax])
        .range([3, 15])

    // 添加动画过渡 - 核心修改部分
    let that = this;
    
    // 1. 更新圆点位置和大小（带过渡动画）
    let circles = d3.select('#scatterplot')
        .selectAll('circle')
        .data(this.data, d => d.PLAYER_ID);  // 使用PLAYER_ID作为关键标识

    // 退出元素动画
    circles.exit()
        .transition()
        .duration(800)
        .attr("r", 0)
        .attr("opacity", 0)
        .remove();

    // 新元素进入动画
    let circlesEnter = circles.enter()
        .append("circle")
        .attr("id", d => "circle-" + d.PLAYER_ID)
        .attr("class", d => `team-circle-color ${d.TEAM_ABBREVIATION}`)
        .attr("cx", that.width/2)  // 从中心开始动画
        .attr("cy", that.height/2)
        .attr("r", 0)
        .attr("opacity", 0)
        .on("mouseup", (d, i) => {
            that.updateSelected(d);
            that.updateSelectedRow(d, true);
            that.updateInfocard(d);
        })
        .on("mouseover", function(d, i) {
            d3.select(this).classed("peek", true);
            let content = `<h2>${d.PLAYER_NAME} #${d.PLAYER_ID}</h2>`;
            if(d.is_legendary) {
                content = `<h2>${String.fromCharCode(9733)}${d.PLAYER_NAME} #${d.PLAYER_ID}</h2>`
            }
            d3.select(".chart-tooltip")
                .style("left", `${d3.event.pageX}px`)
                .style("top", `${d3.event.pageY - 15}px`)
                .style("opacity", ".8")
                .html(content)
        })
        .on("mouseout", function(d) {
            d3.select(this).classed("peek", false);
            d3.select(".chart-tooltip").style("opacity", "0")
        });

    // 合并新元素和现有元素
    circles = circlesEnter.merge(circles);

    // 应用位置和大小变化动画
    circles.transition()
        .duration(1000)
        .ease(d3.easeCubicOut)
        .attr("cx", d => this.xScale(d[xIndicator]))
        .attr("cy", d => this.yScale(d[yIndicator]))
        .attr("r", d => this.circleScale(d[circleSizeIndicator]))
        .attr("opacity", 0.8);

    // 2. 坐标轴过渡动画
    let xLabel = this.indicators.filter(d => d.indicator === xIndicator)[0];
    let yLabel = this.indicators.filter(d => d.indicator === yIndicator)[0];
    
    // X轴动画
    d3.select('#x-axis')
        .transition()
        .duration(1000)
        .call(d3.axisBottom(this.xScale).ticks(10));
    
    d3.select('#x-axis').select('text')
        .text(xLabel.label);

    // Y轴动画
    d3.select('#y-axis')
        .transition()
        .duration(1000)
        .call(d3.axisLeft(this.yScale).ticks(10));
    
    d3.select('#y-axis').select('text')
        .text(yLabel.label);

    this.drawLegend(circleMin, circleMax);
    this.drawDropdowns(xIndicator, yIndicator, circleSizeIndicator);
}
    updateData(data) {
        this.updatePlot(data, this.xIndicator, this.yIndicator, this.circleSizeIndicator)
    }

    clearSelected() {
        d3.select(".plot-svg").selectAll("circle")
            .classed("selected", false)
            .classed("blurred", false);
    }

    /**
     * Borrowed from HW 4
     */
    drawDropdowns(xIndicator, yIndicator, circleSizeIndicator) {
        let that = this;
        let dropDownWrapper = d3.select('.dropdown-wrapper');

        /* X DROPDOWN */
        let dropX = dropDownWrapper.select('#dropdown_x').select('.dropdown-content').select('select');

        let optionsX = dropX.selectAll('option')
            .data(this.indicators)
            .join("option")
            .attr('value', d=> d.indicator)

        optionsX.join("text")
            .text(d => d.label);
    
        let selectedX = optionsX.filter(d => d.indicator === xIndicator)
            .attr('selected', true);

        dropX.on('change', function (d, i) {
            let xValue = this.options[this.selectedIndex].value;
            let yValue = dropY.node().value;
            let cValue = dropC.node().value;
            that.updatePlot(that.data, xValue, yValue, cValue);
        });

        /* Y DROPDOWN */
        let dropY = dropDownWrapper.select('#dropdown_y').select('.dropdown-content').select('select');

        let optionsY = dropY.selectAll('option')
            .data(this.indicators)
            .join("option")
            .attr('value', d => d.indicator)
       
        optionsY.join('text')
            .text(d => d.label);

        let selectedY = optionsY.filter(d => d.indicator === yIndicator)
            .attr('selected', true);

        dropY.on('change', function (d, i) {
            let yValue = this.options[this.selectedIndex].value;
            let xValue = dropX.node().value;
            let cValue = dropC.node().value;
            that.updatePlot(that.data, xValue, yValue, cValue);
        });

        /* CIRCLE DROPDOWN */
        let dropC = dropDownWrapper.select('#dropdown_c').select('.dropdown-content').select('select');
        let optionsC = dropC.selectAll('option')
            .data(this.indicators)
            .join("option")
            .attr('value', d => d.indicator)

        optionsC.join("text")
            .text(d => d.label);

        let selectedC = optionsC.filter(d => d.indicator === circleSizeIndicator)
            .attr('selected', true);

        dropC.on('change', function (d, is) {
            let cValue = this.options[this.selectedIndex].value;
            let xValue = dropX.node().value;
            let yValue = dropY.node().value;
            that.updatePlot(that.data, xValue, yValue, cValue);
        });
    }

        /**
     * Draws the legend for the circle sizes
     *
     * @param min minimum value for the sizeData
     * @param max maximum value for the sizeData
     */
    drawLegend(min, max) {
        const minValue = min ? min : 0;
        const maxValue = max ? max : 0;
        //Draws the circle legend to show size based on health data
        let scale = d3.scaleLinear().domain([minValue, maxValue]).range([3, 15])

        let circleData = [minValue, maxValue];

        let svg = d3.select('.circle-legend').select('svg').select('g');

        let circleGroup = svg.selectAll('g').data(circleData);
        circleGroup.exit().remove();

        let circleEnter = circleGroup.enter().append('g');
        circleEnter.append('circle').classed('neutral', true);
        circleEnter.append('text').classed('circle-size-text', true);

        circleGroup = circleEnter.merge(circleGroup);

        circleGroup.attr('transform', (d, i) => 'translate(' + ((i * (4 * scale(d)))) + ', 25)');

        circleGroup.select('circle').attr('r', (d) => scale(d));
        circleGroup.select('circle').attr('cx', '0');
        circleGroup.select('circle').attr('cy', '0');
        let numText = circleGroup.select('text').text(d => new Intl.NumberFormat().format(d));

        numText.attr('transform', (d) => 'translate(' + ((scale(d)) + 8) + ', 3)');
    }
}
