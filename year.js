!(function (d3) {

// Constants
var w1 = 650;
var h1 = 700;
var sliderHeight1 = 80;
var sliderMargin1 = 40;
var buttonRadius1 = 12;
var scaleHeight1 = 40;
var stretch1 = 3;
var transitionDuration1 = 500;
var currentYear1 = '2014';

var numParticles = 100
var maxVelocity = 8
var color = d3.scaleOrdinal().range(d3.schemeCategory20)
var drag, rects, collisionForce, boxForce;
var popular_selectname = '';
var popular_selectnamelist = [];
var pathdata= [];
var popularScale, yearScale;
var keypath = '';

var svg2 = d3.select("#wordcloud")
    .append("svg")
    .attr("width", w1)
    .attr("height", h1);
var scatter = d3.select("#scatter")
    .append("svg")
    .attr("width", w1+50)
    .attr("height", h1);

// Years slider
var x1 = d3.scaleLinear()
    .domain([2000, 2014])
    .rangeRound([0, w1-2*sliderMargin1])
    .clamp(true);

var slider1 = d3.select('#year_slider')
    .append('svg')
    .attr('width', w1)
    .attr('height', sliderHeight1)
    .append("g")
    .attr("class", "slider")
    .attr("transform", "translate(" + sliderMargin1 + "," + sliderHeight1 / 2 + ")");

slider1.append("line")
    .attr("class", "track")
    .attr("x1", x1.range()[0])
    .attr("x2", x1.range()[1])
    .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
    .attr("class", "track-inset")
    .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
    .attr("class", "track-overlay")
    .call(d3.drag()
    .on("start.interrupt", function() { slider1.interrupt(); })
    .on("end drag", function() { update_cloud(Math.round(x1.invert(d3.event.x))); }));

slider1.insert("g", ".track-overlay")
    .attr("class", "ticks")
    .attr("transform", "translate(0," + 18 + ")")
    .selectAll("text")
    .data(x1.ticks(10))
    .enter().append("text")
    .attr("x", x1)
    .attr("text-anchor", "middle")
    .text(function(d) { return d; });

var handle1 = slider1.insert("circle", ".track-overlay")
    .attr("class", "handle")
    .attr("r", 9);
var handlelabel1 = slider1.insert('text','.track-overlay')
    .attr('class','handlelabel')
    .text('2014')
    .attr("x", x1.range()[1])
    .attr("y", -15)
    .attr('text-anchor','middle')
    .attr('font-size','30px')
    .attr('font-weight','bold');
var yearup1 = d3.select('#year_slider svg').append("circle")
    .attr("class", "handle")
    .attr("r", 12)
    .attr('cx',w1-buttonRadius1-2)
    .attr('cy',sliderHeight1/2)
    .on('click', function() {currentYear1 = Math.min(2014, currentYear1+1); update_cloud(currentYear1)});
var yearuplabel1 = d3.select('#year_slider svg').append("text")
    .text(">")
    .attr('x',w1-buttonRadius1-2)
    .attr('text-anchor','middle')
    .attr('dy','0.35em')
    .attr('y',sliderHeight1/2)
    .style('pointer-events','none');
var yeardown1 = d3.select('#year_slider svg').append("circle")
    .attr("class", "handle")
    .attr("r", 12)
    .attr('cx',buttonRadius1+2)
    .attr('cy',sliderHeight1/2)
    .on('click', function() {currentYear1 = Math.max(2000, currentYear1-1); update_cloud(currentYear1)});
var yeardownlabel1 = d3.select('#year_slider svg').append("text")
    .text("<")
    .attr('x',buttonRadius1+2)
    .attr('text-anchor','middle')
    .attr('dy','0.35em')
    .attr('y',sliderHeight1/2)
    .style('pointer-events','none');

// Word Cloud
var update_cloud = function(year) {
    svg2.selectAll('text').remove();
    currentYear1 = year;
    handle1.attr("cx", x1(year));
    handlelabel1.text(year).attr('x',x1(year));
    var pathfile = "./data_year/yob" + year + ".csv";
    d3.csv(pathfile, function(error, data){ cloud_show(data); })
}

function cloud_show(data) {
    var temlist = [];
    for(var i = 0; i < 50; i++){
        temlist.push({name: data[i].text, size: data[i].frequency});
    }
    popular_selectname = temlist[0];
    popular_selectnamelist = temlist;
    var max_frequency = d3.max(temlist, function (d) { return Number(d.size); });
    var min_frequency = d3.min(temlist, function (d) { return Number(d.size); });
    var fScale = d3.scaleLinear().domain([min_frequency, max_frequency]).range([20, 60]);

    var nodes = temlist.map(function (d, i) {
    var velocity = Math.random() * 2;
    var angle = Math.random() * 180;
    
    var coll = fScale(d.size) > d.name.length ? fScale(d.size) : d.name.length;
    return {
        x: Math.random() * (w1 - coll),
        y: Math.random() * (h1 - coll),
        vx: velocity * Math.cos(angle * Math.PI / 180),
        vy: velocity * Math.sin(angle * Math.PI / 180),
        size: coll*1.7,
        fill: color(i%20),
        l: d.name.length*10,
        name: d.name,
        font: fScale(d.size)
    }
})

 drag = d3.drag()
    .on('start', dragStarted)
    .on('drag', dragged)
    .on('end', dragEnded)

 texts = svg2
    .selectAll('text')
    .data(nodes)
    .enter().append('text')
    .text(function(d){ return d.name})
    .attr('class', 'hover')
    .on("click", function(d){
        scatter.selectAll('path').style("stroke-width", function() { return 1.5; });
        scatter.selectAll('path').style("stroke-opacity", function() { return 0.2; });
        scatter.selectAll('circle').remove();
        var thispath = [];
        var colorcircle = '';
        var s_year = '';
        pathdata.map(function(pathname, i){
            if(pathname[0].name == d.name){
                thispath = pathname;
                colorcircle = color(i%20);   
            }
        })
        thispath.map(function(cir){
            scatter.append("circle")
                .attr("cx", function(){ return yearScale(cir.year)})
                .attr("cy", function(){ return popularScale(cir.popularity) })
                .attr("r", 7)
                .style("fill", colorcircle)
                .on("mouseover", function (d) {
                  //  d3.select(this).style("opacity", function() { return 0.5; });     
                    scatter.append("text")
                        .attr("x", function(){ return yearScale(cir.year)-10})
                        .attr("y", function(){ return popularScale(cir.popularity)+20 })
                        .text("year:" + cir.year)
                        .attr("text-anchor", "middle")
                        .attr("font-size", "20px")
                        .attr("id", "ciryear");   
                    scatter.append("text")
                        .attr("x", function(){ return yearScale(cir.year)-10})
                        .attr("y", function(){ return popularScale(cir.popularity)+40 })
                        .text("frequency:" + cir.popularity)
                        .attr("text-anchor", "middle")
                        .attr("font-size", "20px")
                        .attr("id", "cirpop");
                })
                .on("mouseout", function() {
                    d3.select("#ciryear").remove();
                    d3.select("#cirpop").remove();
                });
            });
        var key = "#path"+ d.name;
        keypath = key;
        scatter.select(key).style("stroke-width", function() { return 3; });
        scatter.select(key).style("stroke-opacity", function() { return 1; });
        scatter.select("#SectorName").text("Selected name: "+d.name).style("fill", colorcircle);
        scatter.select("#title").text("Top 50 popular baby names in "+ currentYear1 + " from 2000-2014");

    })
    .style('fill', function (d) { return d.fill })
    .attr('font-size', function (d) { return d.font})
    .attr('x', function (d) { return d.x })
    .attr('y', function (d) { return d.y })
    .call(drag);

 collisionForce = rectCollide()
    .size(function (d) { return [d.size, d.size] })

 boxForce = boundedBox()
    .bounds([[30, 30], [w1-30, h1-30]])
    .size(function (d) { return [d.size, d.size] })

d3.forceSimulation()
    .velocityDecay(0)
    .alphaTarget(1)
    .on('tick', ticked)
    .force('box', boxForce)
    .force('collision', collisionForce)
    .nodes(nodes)

d3.queue()
.defer(d3.csv, "./data_year/yob2000.csv")
.defer(d3.csv, "./data_year/yob2001.csv")
.defer(d3.csv, "./data_year/yob2002.csv")
.defer(d3.csv, "./data_year/yob2003.csv")
.defer(d3.csv, "./data_year/yob2004.csv")
.defer(d3.csv, "./data_year/yob2005.csv")
.defer(d3.csv, "./data_year/yob2006.csv")
.defer(d3.csv, "./data_year/yob2007.csv")
.defer(d3.csv, "./data_year/yob2008.csv")
.defer(d3.csv, "./data_year/yob2009.csv")
.defer(d3.csv, "./data_year/yob2010.csv")
.defer(d3.csv, "./data_year/yob2011.csv")
.defer(d3.csv, "./data_year/yob2012.csv")
.defer(d3.csv, "./data_year/yob2013.csv")
.defer(d3.csv, "./data_year/yob2014.csv")
.await(function(error, file0, file1, file2, file3, file4, file5,file6,file7,
                file8, file9, file10, file11, file12, file13, file14) {
    
    if (error) { console.error(error);}
    // var nameToshow.name = popular_selectname.name;
    var populaity_list = [];
    popular_selectnamelist.map(function(nameToshow) {
        countInyear = [];
        for(var i = 0; i < file0.length; i++) {
            if(file0[i].text == nameToshow.name) {
                countInyear.push({name: nameToshow.name, popularity: file0[i].frequency, year: 2000});
                break;
            }
            if(i == (file0.length-1) && (file0[i].text != nameToshow.name)){
                countInyear.push({name: nameToshow.name, popularity: 100, year: 2000});
            }
        }
        for(var i = 0; i < file1.length; i++) {
            if(file1[i].text == nameToshow.name) {
                countInyear.push({name: nameToshow.name, popularity: file1[i].frequency, year: 2001});
                break;
            }
            if(i == (file1.length-1) && (file1[i].text != nameToshow.name)){
                 countInyear.push({name: nameToshow.name, popularity: 100, year: 2001});
            }
        }
        for(var i = 0; i < file2.length; i++) {
            if(file2[i].text == nameToshow.name) {
                countInyear.push({name: nameToshow.name, popularity: file2[i].frequency, year: 2002});
                break;
            }
            if(i == (file2.length-1) && (file2[i].text != nameToshow.name)){
                 countInyear.push({name: nameToshow.name, popularity: 100, year: 2002});
            }
        }
        for(var i = 0; i < file3.length; i++) {
            if(file3[i].text == nameToshow.name) {
                countInyear.push({name: nameToshow.name, popularity: file3[i].frequency, year: 2003});
                break;
            }
            if(i == (file3.length-1) && (file3[i].text != nameToshow.name)){
                 countInyear.push({name: nameToshow.name, popularity: 100, year: 2003});
            }
        }
        for(var i = 0; i < file4.length; i++) {
            if(file4[i].text == nameToshow.name) {
                countInyear.push({name: nameToshow.name, popularity: file4[i].frequency, year: 2004});
                break;
            }
            if(i == (file4.length-1) && (file4[i].text != nameToshow.name)){
                 countInyear.push({name: nameToshow.name, popularity: 100, year: 2004});
            }
        }
        for(var i = 0; i < file5.length; i++) {
            if(file5[i].text == nameToshow.name) {
                countInyear.push({name: nameToshow.name, popularity: file5[i].frequency, year: 2005});
                break;
            }
            if(i == (file5.length-1) && (file5[i].text != nameToshow.name)){
                countInyear.push({name: nameToshow.name, popularity: 100, year: 2005});
            }
        }
        for(var i = 0; i < file6.length; i++) {
            if(file6[i].text == nameToshow.name) {
                countInyear.push({name: nameToshow.name, popularity: file6[i].frequency, year: 2006});
                break;
            }
            if(i == (file6.length-1) && (file6[i].text != nameToshow.name)){
                 countInyear.push({name: nameToshow.name, popularity: 100, year: 2006});
            }
        }
        for(var i = 0; i < file7.length; i++) {
            if(file7[i].text == nameToshow.name) {
                countInyear.push({name: nameToshow.name, popularity: file7[i].frequency, year: 2007});
                break;
            }
            if(i == (file7.length-1) && (file7[i].text != nameToshow.name)){
                 countInyear.push({name: nameToshow.name, popularity: 100, year: 2007});
            }
        }
        for(var i = 0; i < file8.length; i++) {
            if(file8[i].text == nameToshow.name) {
                countInyear.push({name: nameToshow.name, popularity: file8[i].frequency, year: 2008});
                break;
            }
            if(i == (file8.length-1) && (file8[i].text != nameToshow.name)){
                 countInyear.push({name: nameToshow.name, popularity: 100, year: 2008});
            }
        }
        for(var i = 0; i < file9.length; i++) {
            if(file9[i].text == nameToshow.name) {
                countInyear.push({name: nameToshow.name, popularity: file9[i].frequency, year: 2009});
                break;
            }
            if(i == (file9.length-1) && (file9[i].text != nameToshow.name)){
                 countInyear.push({name: nameToshow.name, popularity: 100, year: 2009});
            }
        }
        for(var i = 0; i < file10.length; i++) {
            if(file10[i].text == nameToshow.name) {
                countInyear.push({name: nameToshow.name, popularity: file10[i].frequency, year: 2010});
                break;
            }
            if(i == (file10.length-1) && (file10[i].text != nameToshow.name)){
                countInyear.push({name: nameToshow.name, popularity: 100, year: 2010});
            }
        }
        for(var i = 0; i < file11.length; i++) {
            if(file11[i].text == nameToshow.name) {
                countInyear.push({name: nameToshow.name, popularity: file11[i].frequency, year: 2011});
                break;
            }
            if(i == (file11.length-1) && (file11[i].text != nameToshow.name)){
                 countInyear.push({name: nameToshow.name, popularity: 100, year: 2011});
            }
        }
        for(var i = 0; i < file12.length; i++) {
            if(file12[i].text == nameToshow.name) {
                countInyear.push({name: nameToshow.name, popularity: file12[i].frequency, year: 2012});
                break;
            }
            if(i == (file12.length-1) && (file12[i].text != nameToshow.name)){
                 countInyear.push({name: nameToshow.name, popularity: 100, year: 2012});
            }
        }
        for(var i = 0; i < file13.length; i++) {
            if(file13[i].text == nameToshow.name) {
                countInyear.push({name: nameToshow.name, popularity: file13[i].frequency, year: 2013});
                break;
            }
            if(i == (file13.length-1) && (file13[i].text != nameToshow.name)){
                 countInyear.push({name: nameToshow.name, popularity: 100, year: 2013});
            }
        }
        for(var i = 0; i < file14.length; i++) {
            if(file14[i].text == nameToshow.name) {
                countInyear.push({name: nameToshow.name, popularity: file14[i].frequency, year: 2014});
                break;
            }
            if(i == (file14.length-1) && (file14[i].text != nameToshow.name)){
                countInyear.push({name: nameToshow.name, popularity: 100, year: 2014});
            }
        }  
        populaity_list.push(countInyear);
    })
   //console.log(populaity_list);
   pathdata = populaity_list;
   showScatterPlot(populaity_list);
});

}
function rectCollide() {
    var nodes, sizes, masses
    var size = constant([0, 0])
    var strength = 1
    var iterations = 1

    function force() {
        var node, size, mass, xi, yi
        var i = -1
        while (++i < iterations) { iterate() }

        function iterate() {
            var j = -1
            var tree = d3.quadtree(nodes, xCenter, yCenter).visitAfter(prepare)

            while (++j < nodes.length) {
                node = nodes[j]
                size = sizes[j]
                mass = masses[j]
                xi = xCenter(node)
                yi = yCenter(node)

                tree.visit(apply)
            }
        }

        function apply(quad, x0, y0, x1, y1) {
            var data = quad.data
            var xSize = (size[0] + quad.size[0]) / 2
            var ySize = (size[1] + quad.size[1]) / 2
            if (data) {
                if (data.index <= node.index) { return }

                var x = xi - xCenter(data)
                var y = yi - yCenter(data)
                var xd = Math.abs(x) - xSize
                var yd = Math.abs(y) - ySize

                if (xd < 0 && yd < 0) {
                    var l = Math.sqrt(x * x + y * y)
                    var m = masses[data.index] / (mass + masses[data.index])

                    if (Math.abs(xd) < Math.abs(yd)) {
                        node.vx -= (x *= xd / l * strength) * m
                        data.vx += x * (1 - m)
                    } else {
                        node.vy -= (y *= yd / l * strength) * m
                        data.vy += y * (1 - m)
                    }
                }
            }

            return x0 > xi + xSize || y0 > yi + ySize ||
                   x1 < xi - xSize || y1 < yi - ySize
        }

        function prepare(quad) {
            if (quad.data) {
                quad.size = sizes[quad.data.index]
            } else {
                quad.size = [0, 0]
                var i = -1
                while (++i < 4) {
                    if (quad[i] && quad[i].size) {
                        quad.size[0] = Math.max(quad.size[0], quad[i].size[0])
                        quad.size[1] = Math.max(quad.size[1], quad[i].size[1])
                    }
                }
            }
        }
    }

    function xCenter(d) { return d.x + d.vx + sizes[d.index][0] / 2 }
    function yCenter(d) { return d.y + d.vy + sizes[d.index][1] / 2 }

    force.initialize = function (_) {
        sizes = (nodes = _).map(size)
        masses = sizes.map(function (d) { return d[0] * d[1] })
    }

    force.size = function (_) {
        return (arguments.length
             ? (size = typeof _ === 'function' ? _ : constant(_), force)
             : size)
    }

    force.strength = function (_) {
        return (arguments.length ? (strength = +_, force) : strength)
    }

    force.iterations = function (_) {
        return (arguments.length ? (iterations = +_, force) : iterations)
    }

    return force
}

function boundedBox() {
    var nodes, sizes
    var bounds
    var size = constant([0, 0])

    function force() {
        var node, size
        var xi, x0, x1, yi, y0, y1
        var i = -1
        while (++i < nodes.length) {
            node = nodes[i]
            size = sizes[i]
            xi = node.x + node.vx
            x0 = bounds[0][0] - xi
            x1 = bounds[1][0] - (xi + size[0])
            yi = node.y + node.vy
            y0 = bounds[0][1] - yi
            y1 = bounds[1][1] - (yi + size[1])
            if (x0 > 0 || x1 < 0) {
                node.x += node.vx
                node.vx = -node.vx
                if (node.vx < x0) { node.x += x0 - node.vx }
                if (node.vx > x1) { node.x += x1 - node.vx }
            }
            if (y0 > 0 || y1 < 0) {
                node.y += node.vy
                node.vy = -node.vy
                if (node.vy < y0) { node.vy += y0 - node.vy }
                if (node.vy > y1) { node.vy += y1 - node.vy }
            }
        }
    }

    force.initialize = function (_) {
        sizes = (nodes = _).map(size)
    }

    force.bounds = function (_) {
        return (arguments.length ? (bounds = _, force) : bounds)
    }

    force.size = function (_) {
        return (arguments.length
             ? (size = typeof _ === 'function' ? _ : constant(_), force)
             : size)
    }

    return force
}

function ticked() {
    texts
        .attr('x', function (d) { return d.x })
        .attr('y', function (d) { return d.y })
}

var px, py, vx, vy, offsetX, offsetY

function dragStarted(d) {
    vx = 0
    vy = 0
    offsetX = (px = d3.event.x) - (d.fx = d.x)
    offsetY = (py = d3.event.y) - (d.fy = d.y)
}

function dragged(d) {
    vx = d3.event.x - px
    vy = d3.event.y - py
    d.fx = Math.max(Math.min((px = d3.event.x) - offsetX, w1 - d.size), 0)
    d.fy = Math.max(Math.min((py = d3.event.y) - offsetY, h1 - d.size), 0)
}

function dragEnded(d) {
    var vScalingFactor = maxVelocity / Math.max(Math.sqrt(vx * vx + vy * vy), maxVelocity)
    d.fx = null
    d.fy = null
    d.vx = vx * vScalingFactor
    d.vy = vy * vScalingFactor
}

function constant(_) {
    return function () { return _ }
}
update_cloud(2014);
//scatter plot show the populaity changing

// var w1 = 650;
// var h1 = 700;
function showScatterPlot(nameList) {
    scatter.selectAll("*").remove();
    yearScale = d3.scaleLinear().domain([2000, 2014]).range([100, 600]);
    var yearAxis = d3.axisBottom(yearScale).ticks(15).tickFormat(d3.format("d"));
    var max = 0;
    for(var i = 0; i < nameList.length; i++) {
        var maxlist = d3.max(nameList[i], function (d) { return Number(d.popularity); });
        if(maxlist > max) {
            max = maxlist;
        }
    }
    var min = max;
    for(var i = 0; i < nameList.length; i++) {
        var minlist = d3.min(nameList[i], function (d) { return Number(d.popularity); });
        if(minlist < min) {
            min = minlist;
        }
    }
    popularScale = d3.scaleLinear().domain([min, max]).range([600, 100]);
    var popAxis = d3.axisLeft(popularScale);    
    scatter.append("g").attr("transform", "translate(0, 600)").call(yearAxis);
    scatter.append("g").attr("transform", "translate(100, 0)").call(popAxis);
    
    var pathGenerator = d3.line()
        .x(function (d) { return yearScale(d.year); })
        .y(function (d) { return popularScale(d.popularity); });
    scatter.append("text")
        .attr("id", "title")
        .attr("x", 350)
        .attr("y", 50)
        .style("font-size", "20pt")
        .style("text-anchor", "middle");
    scatter.append("text")
        .attr("id", "SectorName")
        .attr("x", 350)
        .attr("y", 80)
        .style("font-size", "16pt")
        .style("text-anchor", "middle");
    scatter.append("text")
        .attr("id", "pathName")
        .attr("x", 350)
        .attr("y", 100)
        .style("font-size", "12pt")
        .style("text-anchor", "middle");

    scatter.selectAll("path.lineGraph").data(nameList)
        .enter().append("path")
        .attr("class", "lineGraph")
        .attr("d", function(sector) {
            return pathGenerator(sector);
        })  
        .attr("id", function(d){
            return "path"+d[0].name;
        })
        .style("stroke", function(sector, i) {
            return color(i%20);
        })
        .on("mouseover", function(d, i){
            scatter.select("#pathName").text("Selected path : "+d[0].name).style("fill", color(i%20));
            d3.select(this).style("stroke-opacity", function() { return 1; });
          //  d3.select(this).style("stroke-width", function() { return 4; });
        })
        .on("mouseout", function(d){
            scatter.select("#pathName").text("");
            if (keypath != ("#path"+d[0].name)){
                d3.select(this).style("stroke-opacity", function() { return 0.2; });
              //  d3.select(this).style("stroke-width", function() { return 1.5; });
            }
        });
    scatter.append("text")
        .text("Year")
        .attr("x", 350)
        .attr("y", 650)
        .style("font-size", "18pt");
    scatter.append('text')
        .text("Frequency")
        .attr("text-anchor", "middle")
        .attr("transform", "translate("+40+","+"350)"+" rotate(-90)")
        .attr("stroke-color", "black")
        .attr("font-size", "18pt");
    scatter.select("#title").text("Top 50 popular baby names in "+ currentYear1+ " from 2000-2014");

}

})(d3);