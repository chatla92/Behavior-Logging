if(document.getElementById("vis")){
$.ajax({
   type : 'GET',
   url: "https://behavior.com/visulaize",
   contentType: "text/plain",
   success: function(response){
	// Activity Visualiztion
        var width = 960,
            height = 136,
            cellSize = 17;

        var formatPercent = d3.format(".1%");

        var color = d3.scaleQuantize()
            .domain(response.domain)
            .range(["#a50026", "#d73027", "#f46d43", "#fdae61", "#fee08b", "#ffffbf", "#d9ef8b", "#a6d96a", "#66bd63", "#1a9850", "#006837"]);

        var svg = d3.select("#vis")
          .selectAll("svg")
          .data(response.years)
          .enter().append("svg")
            .attr("width", width)
            .attr("height", height)
          .append("g")
            .attr("transform", "translate(" + ((width - cellSize * 53) / 2) + "," + (height - cellSize * 7 - 1) + ")");

        svg.append("text")
            .attr("transform", "translate(-6," + cellSize * 3.5 + ")rotate(-90)")
            .attr("font-family", "sans-serif")
            .attr("font-size", 10)
            .attr("text-anchor", "middle")
            .text(function(d) { return d; });

	daily = response.daily
        var rect = svg.append("g")
            .attr("fill", "none")
            .attr("stroke", "#ccc")
          .selectAll("rect")
          .data(function(d) { return d3.timeDays(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
          .enter().append("rect")
            .attr("width", cellSize)
            .attr("height", cellSize)
            .attr("x", function(d) { return d3.timeWeek.count(d3.timeYear(d), d) * cellSize; })
            .attr("y", function(d) { return d.getDay() * cellSize; })
	    .on("click",function(d){
                if( d in daily){
			var temp_data = []
			Object.keys(daily[d]).forEach(function(tag){
                                temp_data.push({"label":tag, "value":daily[d][tag]});
                        })
			tagsvis(temp_data,d);
		}
		else{
			alert("No tags are recorded on "+d + ".\nThe following dates have entries: \n"+ Object.keys(daily));
		}
		d3.event.stopPropagation();
            })
            .datum(d3.timeFormat("%Y-%m-%d"));

        svg.append("g")
            .attr("fill", "none")
            .attr("stroke", "#000")
          .selectAll("path")
          .data(function(d) { return d3.timeMonths(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
          .enter().append("path")
            .attr("d", pathMonth);

        heat = response.heat
        rect.filter(function(d) { return d in heat; })
            .attr("fill", function(d) { return color(heat[d]); })
          .append("title")
            .text(function(d) { return d + ": " + heat[d]+" Activities Recorded" });


        function pathMonth(t0) {
          var t1 = new Date(t0.getFullYear(), t0.getMonth() + 1, 0),
              d0 = t0.getDay(), w0 = d3.timeWeek.count(d3.timeYear(t0), t0),
              d1 = t1.getDay(), w1 = d3.timeWeek.count(d3.timeYear(t1), t1);
          return "M" + (w0 + 1) * cellSize + "," + d0 * cellSize
              + "H" + w0 * cellSize + "V" + 7 * cellSize
              + "H" + w1 * cellSize + "V" + (d1 + 1) * cellSize
              + "H" + (w1 + 1) * cellSize + "V" + 0
              + "H" + (w0 + 1) * cellSize + "Z";
        }
	
	// Tags Visualization
	var fst_date = Object.keys(daily)[0];
	var fst_temp = [];
	Object.keys(daily[fst_date]).forEach(function(tag){
                                fst_temp.push({"label":tag, "value":daily[fst_date][tag]});
                        })
	tagsvis(fst_temp,fst_date);
	//Social
	pie_data1 = {
                size: {
                        canvasHeight: 500,
                        canvasWidth: 500
                },
                header: {
                        title: {
                                text: ""
                        }
                },
                data: {
                        content: []
                },
                "tooltips": {
                        "enabled": true,
                        "type": "placeholder",
                        "string": "{label}: {value}, {percentage}%"
                },
                "effects": {
                        "pullOutSegmentOnClick": {
                                "effect": "linear",
                                "speed": 400,
                                "size": 8
                        }
                }
        }

        pie_data1["data"]["content"] = response.social
        var pie1 = new d3pie("social", pie_data1);
	
	//Successful queries
        var tooltip = d3.select("body")
	.append("div")
	.style("position", "absolute")
	.style("z-index", "10")
	.style("visibility", "hidden")
	.style("background", "lightsteelblue")
	.style("font","12px sans-serif")
        .style("border","0px")
        .style("border-radius","8px")
	.html("<strong>Success tags</strong><br>"+
               response.success['pass'] +
               "<br><br><strong>Failure tags</strong><br>" +  response.success['fail'])

	d3.select("#success").call(drawCircularProgressBar, response.success);
	function fix(k) {
 	   var t0, t1 = k * 2 * Math.PI;

   	   // Solve for theta numerically.
   	   if (k > 0 && k < 1) {
        	t1 = Math.pow(12 * k * Math.PI, 1 / 3);
        	for (var i = 0; i < 10; ++i) {
            		t0 = t1;
            		t1 = (Math.sin(t0) - t0 * Math.cos(t0) + 2 * k * Math.PI) / (1 - Math.cos(t0));
        	}
        	k = (1 - Math.cos(t1 / 2)) / 2;
   	 }
    	return k;
	}
	
	function drawCircularProgressBar(selection, success) {
       	    if (selection) {
       	        var r = 120;       // radius of the ball

	   	var h = 0;
           	var zero = 0;
           	var one = 0;
           	var text = "N/A";
		var k = success['val']
           	if (k >= 0) {
           	    var fixed = fix(k);
           	    h = r * 2 * (1 - fixed);
           	    zero = 1;
           	    one = k;
           	    text = parseInt(k * 100) + "%";
           	}
       	        selection.selectAll("svg").remove();
       	        selection.append("svg").attr("width", "330px").attr("height", "300px")
       	            .attr("viewBox", "0 0 " + r*2 + " " + r*2)
       	            .call(function(e) {
       	                var defs = e.append("defs")
       	                var clip = defs.append("clipPath").attr("id", "clip")
       	                .append("rect").attr("x", "-" + r).attr("y", "-" + r)
       	                .attr("width", r*2).attr("height", h);
       	            g = e.append("g").attr("transform", "translate(" + r + "," + r + ")");
       	            g.append("circle").attr("r", r).attr("class", "na");
       	            g.append("circle").attr("r", r).style("fill-opacity", zero).attr("class", "zero");
       	            g.append("circle").attr("r", r).style("fill-opacity", one).attr("class", "one");
       	            g.append("circle").attr("r", r).style("fill", "#333").style("fill-opacity", 0.5).attr("clip-path", "url(#clip)"),	
       	            g.append("text").attr("class", "value").attr("text-anchor", "middle").attr("font-size", "100").style("fill", "white").style("fill-opacity", .7).text(text);
       	            })
                     .on("mouseover", function(){return tooltip.style("visibility", "visible");})
		     .on("mousemove", function(){return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");})
		     .on("mouseout", function(){return tooltip.style("visibility", "hidden");});
       	    }
        }	
    },
});

}
function tagsvis(data,date) {
	$('#tags svg').remove();
	$('#tag_data').html("Time spent on each tags on "+date)
	pie_data = {
                size: { 
                        canvasHeight: 500,
                        canvasWidth: 500
                },
                header: {
                        title: {
                                text: ""
                        }
                },
                data: {
                        content: []
                },
		"tooltips": {
			"enabled": true,
			"type": "placeholder",
			"string": "{label}: {value}, {percentage}%"
		},
		"effects": {
			"pullOutSegmentOnClick": {
				"effect": "linear",
				"speed": 400,
				"size": 8
			}
		}
        }
        pie_data["data"]["content"] = data

        var pie = new d3pie("tags", pie_data);
}
