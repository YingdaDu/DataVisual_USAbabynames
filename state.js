!(function (d3) {

// Constants
var w = 650;
var h = 850;
var sliderHeight = 80;
var sliderMargin = 40;
var buttonRadius = 12;
var scaleHeight = 40;
var stretch = 3;
var transitionDuration = 500;
var currentYear = '2014';
var currentGender = 'F';

var svg = d3.select("#chart")
    .append("svg")
    .attr("width", w)
    .attr("height", h);

// Gender selector
var girls = d3.select('#girls');
var boys = d3.select('#boys');
girls.on('click',function() {
    girls.attr('class','gender selected');
    boys.attr('class','gender');
    update_chart('F', currentYear);
    bar_graph();
    showMap();
})
boys.on('click',function() {
    boys.attr('class','gender selected');
    girls.attr('class','gender');
    update_chart('M', currentYear);
    bar_graph();
    showMap();
})


// Years slider
var x = d3.scaleLinear()
    .domain([1990, 2014])
    .rangeRound([0, w-2*sliderMargin])
    .clamp(true);

var slider = d3.select('#slider')
    .append('svg')
    .attr('width', w)
    .attr('height', sliderHeight)
    .append("g")
    .attr("class", "slider")
    .attr("transform", "translate(" + sliderMargin + "," + sliderHeight / 2 + ")");

slider.append("line")
    .attr("class", "track")
    .attr("x1", x.range()[0])
    .attr("x2", x.range()[1])
    .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
    .attr("class", "track-inset")
    .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
    .attr("class", "track-overlay")
    .call(d3.drag()
        .on("start.interrupt", function() { slider.interrupt(); })
        .on("end drag", function() {
            update_chart(currentGender, Math.round(x.invert(d3.event.x)));
            bar_graph();
            showMap();}
        )
    );

slider.insert("g", ".track-overlay")
    .attr("class", "ticks")
    .attr("transform", "translate(0," + 18 + ")")
    .selectAll("text")
    .data(x.ticks(10))
    .enter().append("text")
    .attr("x", x)
    .attr("text-anchor", "middle")
    .text(function(d) { return d; });

var handle = slider.insert("circle", ".track-overlay")
    .attr("class", "handle")
    .attr("r", 9);
var handlelabel = slider.insert('text','.track-overlay')
    .attr('class','handlelabel')
    .text('2014')
    .attr("x", x.range()[1])
    .attr("y", -15)
    .attr('text-anchor','middle')
    .attr('font-size','30px')
    .attr('font-weight','bold');
var yearup = d3.select('#slider svg').append("circle")
    .attr("class", "handle hover")
    .attr("r", 12)
    .attr('cx', w-buttonRadius-2)
    .attr('cy', sliderHeight/2)
    .on('click', function() {
        currentYear = Math.min(2014, currentYear+1);
        update_chart(currentGender, currentYear);
        bar_graph();
        showMap();}
    );
var yearuplabel = d3.select('#slider svg').append("text")
    .text(">")
    .attr('x',w-buttonRadius-2)
    .attr('text-anchor','middle')
    .attr('dy','0.35em')
    .attr('y',sliderHeight/2)
    .style('pointer-events','none');
var yeardown = d3.select('#slider svg').append("circle")
    .attr("class", "handle hover")
    .attr("r", 12)
    .attr('cx',buttonRadius+2)
    .attr('cy',sliderHeight/2)
    .on('click', function() {
        currentYear = Math.max(1990, currentYear-1);
        update_chart(currentGender, currentYear);
        bar_graph();
        showMap();}
    );
var yeardownlabel = d3.select('#slider svg').append("text")
    .text("<")
    .attr('x',buttonRadius+2)
    .attr('text-anchor','middle')
    .attr('dy','0.35em')
    .attr('y',sliderHeight/2)
    .style('pointer-events','none');

// Treemap
var treemap = d3.treemap()
             .size([w/stretch,h])
             .round(true)

var lettercolors = {};
for (var i = 0; i < 26; i++) {
    lettercolors["ABCDEFGHIJKLMNOPQRSTUVWXYZ".charAt(i)] = d3.interpolateRainbow(Math.min(25,i+1)/25.);
}

// Scale
var scale = d3.select('#scale')
    .append('svg')
    .attr("width", w)
    .attr("height", scaleHeight);
var scaleRect = scale.append('rect')
    .attr('width', scaleHeight-10)
    .attr('height', scaleHeight-10)
    .attr('x', 5)
    .attr('y', 5)
    .attr('fill', 'black');
var scaleText = scale.append('text')
    .text('One baby per thousand')
    .attr('x', scaleHeight+5)
    .attr('y', scaleHeight/2)
    .attr('dy','0.35em');

var popular_namelist = [];
var key = function(d) { return d.data.name; }

var update_chart = function(gender, year) {
    currentYear = year;
    currentGender = gender;

    nameOntop.text("");

    handle.attr("cx", x(year));
    handlelabel.text(year).attr('x',x(year));

    var root = d3.hierarchy(dataset[gender]['Y'+year]);
    root.sum(function(d) { return d.children ? 0 : d.popularity; });
    treemap(root);

    var node = svg.selectAll("rect").data(root.leaves(), key);
    var labels = svg.selectAll("text").data(root.leaves(), key);
    
    var tmp = [];
    root.leaves().map(function(d){
        tmp.push({name: d.data.name, popularity: d.data.popularity, color: lettercolors[d.data.name.charAt(0)]});
    });

    popular_namelist = tmp;
    popular_namelist.sort(function(a, b){return b.popularity - a.popularity;});

    // Adjust scale
    scalew = Math.round(Math.sqrt(w*h/root.value));
    scaleRect.attr('width', scalew)
    .attr('height', scalew)
    .attr('x', Math.round((scaleHeight-scalew)/2))
    .attr('y', Math.round((scaleHeight-scalew)/2))

    //Add
    node.enter()
        .append('rect')
        .attr('class', 'hover')
        .attr('id', 'babyrect')
        .attr('x',function(d) {return (d.x0+d.x1)*stretch/2;})
        .attr('y',function(d) {return (d.y0+d.y1)/2+5;})
        .attr('width', 0)
        .attr('height',0)
        .attr('title', function(d) {return d.data.name + " " + d.data.popularity.toFixed(2);})
        .transition()
        .duration(transitionDuration)
        .attr("x", function(d) {return d.x0*stretch;})
        .attr("y", function(d) {return d.y0;})
        .attr('width', function(d) {return (d.x1-d.x0)*stretch-1;})
        .attr('height', function(d) {return d.y1-d.y0-1;})
        .attr('fill',function(d) {return lettercolors[d.data.name.charAt(0)];});
    d3.selectAll("#babyrect")
        .on("click", function (d) { 
            putName(d.data.name, lettercolors[d.data.name.charAt(0)]); 
            bar_graph();
            hoverMap(currentGender, currentYear, d.data.name, lettercolors[d.data.name.charAt(0)]); 
        });
    labels.enter()
        .append('text')
        .attr('class', 'hover')
        .attr('title', function(d) {return d.data.name + " " + d.data.popularity.toFixed(2);})
        .text(function(d) { return d.data.name;})
        .attr('x',function(d) {return (d.x0+d.x1)*stretch/2;})
        .attr('y',function(d) {return (d.y0+d.y1)/2})
        .attr('text-anchor','middle')
        .attr('font-size',function(d) {return Math.round(14+0.6*d.data.popularity) + 'px';})
        .attr('dy','0.35em')
        .on("click", function (d) { 
            putName(d.data.name, lettercolors[d.data.name.charAt(0)]); 
            bar_graph();
            hoverMap(currentGender, currentYear, d.data.name, lettercolors[d.data.name.charAt(0)]); 
        });

    //Update
    node.transition()
        .duration(transitionDuration)
        .attr("x", function(d) {return d.x0*stretch;})
        .attr('width', function(d) {return (d.x1-d.x0)*stretch-1;})
        .attr("y", function(d) {return d.y0;})
        .attr('height', function(d) {return d.y1-d.y0-1;})
        .attr('title', function(d) {return d.data.name + " " + d.data.popularity;})
    labels.transition()
        .duration(transitionDuration)
        .attr('x',function(d) {return (d.x0+d.x1)*stretch/2;})
        .attr('y',function(d) {return (d.y0+d.y1)/2;})
        .attr('title', function(d) {return d.data.name + " " + d.data.popularity.toFixed(2);})
        .attr('font-size',function(d) {return Math.round(10+0.6*d.data.popularity) + 'px';});

    //Remove
    node.exit()
        .transition()
        .duration(transitionDuration)
        .attr('x',function(d) {return (d.x0+d.x1)*4/2;})
        .attr('y',function(d) {return (d.y0+d.y1)/2;})
        .attr('width', 0)
        .attr('height',0)
        .remove();
    labels.exit()
        .remove();
};

// Popularity bar graph
var popularity_bar = d3.select("#list").append("svg")
    .attr("width", w)
    .attr("height", 300);

function bar_graph() {
    popularity_bar.selectAll("*").remove();

    var top10names = [];
    for (var i = 0; i < 10; i++) {
        top10names.push(popular_namelist[i]);
    }

    var max = d3.max(top10names, function (d) { return Number(d.popularity); });
    var xScale = d3.scaleLinear().domain([0, 10]).range([100, 600]);
    var yScale = d3.scaleLinear().domain([3, max]).range([250, 10]);
    var xAxis = d3.axisBottom(xScale).ticks(0);
    var yAxis = d3.axisLeft(yScale);

    popularity_bar.append("g").attr("transform", "translate(0, 250)").call(xAxis);
    popularity_bar.append("g").attr("transform", "translate(100, 0)").call(yAxis);

    top10names.map(function(d, i){
        popularity_bar.append('rect')
            .attr('class', 'hover')
            .attr("x", xScale(i+0.3))
            .attr("y", yScale(d.popularity))
            .attr("width", 30)
            .attr("height", 250-yScale(d.popularity))
            .attr("fill", "lightgrey")
            .on("click", function(){
                popularity_bar.selectAll('rect').style("fill", function() { return "lightgrey"; });
                putName(d.name, d.color); 
                hoverMap(currentGender, currentYear, d.name, d.color); 
                d3.select(this).style("fill", function() { return d.color; });
            });

        popularity_bar.append('text')
            .text(d.name)
            .attr("text-anchor", "start")
            .attr("transform", "translate("+xScale(i+0.3)+","+"300)"+" rotate(-60)")
            .attr("stroke-color", "black")
            .attr("font-size", "16px")
            .attr("font-weight", "2px");
    });
    popularity_bar.append('text')
        .text("popularity")
        .attr("text-anchor", "middle")
        .attr("transform", "translate("+50+","+"150)"+" rotate(-90)")
        .attr("stroke-color", "black")
        .attr("font-size", "16px");
    popularity_bar.append('text')
        .text("(per thousand people)")
        .attr("text-anchor", "middle")
        .attr("transform", "translate("+70+","+"150)"+" rotate(-90)")
        .attr("stroke-color", "black")
        .attr("font-size", "14px");

}

d3.json("namesdata.json", function(error, data) {
    if (error) {return console.error(error);}
    dataset = data;
    update_chart(currentGender, currentYear);
    bar_graph();
});


// Map
var svg1 = d3.select("#map").append("svg")
    .attr("width", w)
    .attr("height", 450);
var nameOntop = d3.select("#selected-name").append("svg")
    .attr("width", w)
    .attr("height", 60);
var maptitle = d3.select("#maptitle").append("svg")
    .attr("width", w)
    .attr("height", 50);
var bartitle = d3.select("#bartitle").append("svg")
    .attr("width", w)
    .attr("height", 50);
maptitle.append("text")
    .text("Baby Names per State")
    .attr("x", 300)
    .attr("y", 50)
    .attr("text-anchor", "middle")
    .attr("stroke-color", "black")
    .attr("font-size", "24pt");
bartitle.append("text")
        .text("Top 10 baby names of year selected")
    .attr("x", 300)
    .attr("y", 50)
    .attr("text-anchor", "middle")
    .attr("stroke-color", "black")
    .attr("font-size", "24pt");

var projection = d3.geoAlbersUsa().scale(75);
var pathGenerator = d3.geoPath().projection(projection);
var states;
var label, circles;

d3.json("us.json", function (error, rawMap, rawAtlas) {
    states = topojson.feature(rawMap, rawMap.objects.states);  
    showMap();
});

function showMap() {
    svg1.selectAll('circle').remove();
    svg1.selectAll('text').remove();
    projection.fitExtent([[0,0], [svg1.attr("width"), svg1.attr("height")]], states);
    pathGenerator = d3.geoPath().projection(projection);
    
    var paths = svg1.selectAll("path.state").data(states.features);
    paths.enter().append("path").attr("class", "state")
    .attr("d", function (state) {
        return pathGenerator(state);
    })
}

function putName(name, color) {
    nameOntop.selectAll('text').remove();
    nameOntop.append("text")
        .text("Selected Name: " + name)
        .attr("x", 300)
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .attr("fill", color)
        .attr("font-size", "18pt");
}

function hoverMap(currentGender, currentYear, name, color) {
    svg1.selectAll('circle').remove();
    svg1.selectAll('text').remove();

    var file = "./" + currentGender + "/" + currentYear + ".csv";
    ids = [];
    d3.csv(file, function(error, data) {
        
        data.map(function(d, i) {
            if(d.Name == name) {
                var obj = {id: d.id, count: d.Count, state: d.State}
                ids.push(obj);
            }
        })
        if (ids.length == 0) {
            nameOntop.append("text")
            .text("No popularity in any state !")
            .attr("x", 300)
            .attr("y", 60)
            .attr("text-anchor", "middle")
            .attr("fill", color)
            .attr("font-size", "24pt");
        }
        var huecolor = d3.hsl(color).h;
        var countExtent = d3.extent(ids, function(d) { return Number(d.count); });
        var countScale = d3.scaleLinear().domain(countExtent).range([5, 40]);
        var colorScale = d3.scaleLinear().domain(countExtent).range([0.3, 0.7]);

        circles = svg1.selectAll('circle').data(states.features);
        label = svg1.selectAll("text").data(states.features);

        circles.enter()
            .append('circle')
            .attr("transform", function(d) { 
                return "translate(" + pathGenerator.centroid(d) + ")"; 
            })
            .attr("r", function(d){
                var id = d.id;
                var istrue = 0;
                var count = 0;
                for (var i = 0; i < ids.length; i++) {
                    if(id == ids[i].id) {
                        istrue = 1;
                        count = ids[i].count;
                    }
                }
                if(istrue == 1) {
                    var c = countScale(count);
                    return c/1.2;
                }
            })
            .style("fill", color)
            .style("stroke", "black")
            .on("mouseover", function (d) {
                svg1.selectAll('text').remove()
                d3.select(this).style("opacity", function() { return 0.5; }); 

                svg1.selectAll('text').remove();
                svg1.append("text")
                    .attr("transform", function() { return  "translate(" + pathGenerator.centroid(d) + ")"; })
                    .text(function(){
                        var id = d.id;
                        var istrue = 0;
                        var count = 0;
                        var name = ''
                        for (var i = 0; i < ids.length; i++) {
                        if(id == ids[i].id) {
                            istrue = 1;
                            count = ids[i].count;
                            name = ids[i].state;
                        }
                        }
                        if(istrue == 1) {
                            return name + ":" + count;
                        }
                    })
                    .attr("text-anchor", "middle")
                    .attr("font-size", "30px");
            })
            .on("mouseout", function() {
               d3.select(this).style("opacity", function() { return 1; }); 
            });
        

    });
  
}

/* References:
    Slider: https://bl.ocks.org/mbostock/6452972
    TreeMap: https://bl.ocks.org/mbostock/4063582
*/

})(d3);