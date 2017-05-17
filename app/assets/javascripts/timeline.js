function parseData(top, data) {
  var lineSegments = [];
  var points = [];
  for (var i=0;i<(data.length-1);i++){
    var friend = data[i];
    var pos = i%2 === 0;
    for (var ii=0;ii<(friend.checkins.length-1);ii++){
      var pt = friend.checkins[ii];
      var sourceDate = ii === 0 ? top-1000000000000 : friend.checkins[ii-1].date;
      var l = {
        pos: pos,
        source: {x: 3, y: sourceDate},
        target: {x: 3, y: pt.date},
        foursquare_id: pt.foursquare_id,
        friend: friend
      }
      lineSegments.push(l)
      var checkin = points.find(function(p){
        return p.foursquare_id === pt.foursquare_id
      })
      if (checkin) {
        checkin.friends.push(friend);
      } else {
        points.push({
          date: pt.date,
          venue_name: pt.venue_name,
          foursquare_id: pt.foursquare_id,
          friends: [friend]
        })
      }
    }
  }
  return {lines: lineSegments, points: points};
}

function pointFill(d) {
  if (d.friends.length === 1) {
    return '#fff';
  } else {
    return "url(#gradient-"+d.foursquare_id+")";
  }
}

function pointsWidth(l){
  return l*3 + 7;
}


$(document).ready(function(){
  var data = $('#init-data').data('all');
  var parsedData = parseData(data.top, data.lines)
  var width = $(window).width();
  var height = 40000;

  var x = d3.scaleLinear().domain([0,6]).range([0, width]);
  var y = d3.scaleTime().domain([(data.top), (data.top+data.full_length)]).range([0, height]);

  function valueline(d){
    var dx = x(d.target.x) - x(d.source.x),
    dy = y(d.target.y) - y(d.source.y),
    dr = Math.sqrt(dx * dx + dy * dy);
    var dir = d.pos ? '1' : '0';
    var starting = x(d.source.x) + "," + y(d.source.y);
    var ending = x(d.target.x) + "," + y(d.target.y)
    return "M" + starting + "A" + dr + "," + dr + " 0 0,"+dir+" " + ending;
  }

  var svg = d3.select("#timeline").append("svg").attr("width", width).attr("height", height)

  var fullTime = d3.timeMonths(data.top, data.top+data.full_length);

  var defs = svg.append("defs");
  var filter = defs.append("filter")
    .attr("id", "yellow-highlight")
    .attr("x", "0%")
    .attr("width", "100%");
  filter.append("feFlood")
    .attr("flood-color", "yellow");
  filter.append("feComposite")
    .attr("in", "SourceGraphic");

  var colorMonths = ['white', 'blue', 'green', 'yellow', 'red', 'purple', 'white', 'blue', 'green', 'yellow', 'red', 'purple'];

  var rainbow = defs.append("linearGradient")
    .attr("id", "rainbow-gradient")
    .attr("x2", "0%")
    .attr("y2", "100%");

  fullTime.forEach(function(t, i){
    var color = colorMonths[t.getMonth()-1];
    rainbow.append("stop")
      .attr("offset", i/fullTime.length*100+'%')
      .attr("stop-color", color);
  })

  for (var i=0;i<parsedData.points.length;i++) {
    var pt = parsedData.points[i];

    if (pt.friends.length > 1) {
      var totalLength = pointsWidth(pt.friends.length)

      var gradient = defs.append("pattern")
        .attr("width", totalLength)
        .attr("height", totalLength)
        .attr("patternUnits", "objectBoundingBox")
        .attr("id", "gradient-"+pt.foursquare_id);

      gradient.append("rect")
        .attr("fill", '#fff')
        .attr("x", totalLength/2 - 2.5)
        .attr("y", totalLength/2 - 2.5)
        .attr("width", 5)
        .attr("height", 5);

      for (var ii=0;ii<pt.friends.length;ii++){
        var fr = pt.friends[ii];
        var rectLength = pointsWidth(ii);
        gradient.append("rect")
          .attr("class", "rect-pattern")
          .attr("stroke", fr.color)
          .attr("x", totalLength/2 - rectLength/2)
          .attr("y", totalLength/2 - rectLength/2)
          .attr("width", rectLength)
          .attr("height", rectLength);
      }
    }
  }

  function showVenueInfo(showNode, d){
    var label = showNode.append("g").attr("class", "label");
    label.append("text")
      .text( function(d){return d.venue_name})
      .attr("class", "label-text")
      .attr("transform", "translate(10,0)")
      .attr("x", function(d) { return x(3); })
      .attr("y", function(d) { return y(d.date); })
      .style("filter", "url(#yellow-highlight)");

    if (d) {
      var labelFriends = label.append("text")
        .attr("class", "label-friends")
        .attr("text-anchor", "end")
        .attr("transform", "translate(-15,0)")
        .attr("x", function(d) { return x(3); })
        .attr("y", function(d) { return y(d.date); })
      labelFriends.attr("y", y(d.date) - (d.friends.length*16)/2 - 8);
      for (var i=0;i<d.friends.length;i++) {
        labelFriends.append("tspan")
          .attr("class", "friend-label")
          .attr("x", x(3))
          .attr("dy", "16px")
          .attr("fill", d.friends[i].color)
          .text(d.friends[i].name)
      }
    }
  }

  svg.append("line")
    .attr("class", "me")
    .attr("x1", function(d) { return x(3); })
    .attr("y1", function(d) { return y(data.top); })
    .attr("x2", function(d) { return x(3); })
    .attr("y2", function(d) { return y(data.top+data.full_length); });

  var friendLine = svg.selectAll(".line")
      .data(parsedData.lines)
    .enter().append("g").attr("class", "line");

  friendLine.append("path")
    .attr("class", "line-segment")
    .attr('stroke', function(d) { return d.friend.color; })
    .attr("x1", function(d) { return x(d.source.x); })
    .attr("y1", function(d) { return y(d.source.y); })
    .attr("x2", function(d) { return x(d.target.x); })
    .attr("y2", function(d) { return y(d.target.y); })
    .attr("d", valueline);

  function highlightLine(d){
    svg.selectAll(".line-segment, .point").attr("opacity", "0.3")
    var showLine = friendLine.filter(function(l) { return l.friend.foursquare_id === d.friend.foursquare_id });
    showLine.select(".line-segment").attr("opacity", "1").style("stroke-width", "3px");
    var selectedNodes = node.filter(function(l) { return l.friends.indexOf(d.friend) !== -1 });
    showVenueInfo(selectedNodes)
    selectedNodes.select(".point").attr("opacity", "1");
    $('<div id="name-card">'+d.friend.name+'</div>')
      .css('color', d.friend.color)
      .css('width', 100)
      .css('left', d3.event.pageX-115)
      .css('top', d3.event.pageY-10)
      .appendTo('body');
  }

  function unHighlightLine(d){
    svg.selectAll(".line-segment").attr("opacity", "1").style("stroke-width", "1px");
    svg.selectAll(".point").attr("opacity", "1").style("stroke-width", "2px");
    svg.selectAll(".label").remove();
    $('#name-card').remove();
  }

  friendLine.append("path")
    .attr("class", "line-segment-overlay")
    .attr('stroke', 'transparent')
    .attr("x1", function(d) { return x(d.source.x); })
    .attr("y1", function(d) { return y(d.source.y); })
    .attr("x2", function(d) { return x(d.target.x); })
    .attr("y2", function(d) { return y(d.target.y); })
    .attr("d", valueline)
    .on("mouseover", highlightLine)
    .on("mouseout", unHighlightLine)

  var node = svg.selectAll(".node")
    .data(parsedData.points)
  .enter().append("g").attr("class", function(d) { return "node " + d.foursquare_id });

  function highlightNode(d){
    svg.selectAll(".line-segment, .point").attr("opacity", "0.3")
    var showNode = node.filter(function(p) { return p.foursquare_id === d.foursquare_id });
    showNode.select(".point").attr("opacity", "1");
    showVenueInfo(showNode, d)
    var selectedLines = friendLine.filter(function(l) {return d.friends.indexOf(l.friend) !== -1 });
    selectedLines.select(".line-segment").attr("opacity", "1").style("stroke-width", "3px")
  }

  function unHighlightNode(d){
    var showNode = node.filter(function(p) { return p.foursquare_id === d.foursquare_id });
    showNode.select(".label").remove()
    svg.selectAll(".line-segment").attr("opacity", "1").style("stroke-width", "1px");
    svg.selectAll(".point").attr("opacity", "1").style("stroke-width", "2px");
  }

  var point = node.append("rect")
    .attr("class", "point")
    .attr("fill", pointFill)
    .attr("stroke", function(d){ return d.friends[0].color })
    .attr("width", function(d) {return pointsWidth(d.friends.length)})
    .attr("height", function(d) {return pointsWidth(d.friends.length)})
    .attr("x", function(d) { return x(3); })
    .on("mouseover", highlightNode)
    .on("mouseout", unHighlightNode)

  function setPointData(point){
    point
      .attr('transform', function(d){return 'translate(0,-'+((pointsWidth(d.friends.length)/2)+3) +') rotate(45 '+x(3)+' '+y(d.date)+')'})
      .attr("y", function(d) { return y(d.date); })
  }

  setPointData(point)

  svg.append("rect")
    .attr("class", "calendar")
    .attr("height", height)
    .attr("width", 50)
    .attr("fill",  "url(#rainbow-gradient)")
    .on("mousedown", function(d){
      height = 3000;
      var t0 = svg.transition().duration(750);
      y.range([0, height]);
      setPointData(t0.selectAll('.point'))
      t0.selectAll('.line-segment, .line-segment-overlay').attr("d", valueline);
    })

  svg.append('g')
    .attr('transform', 'translate(50,0)')
    .call(d3.axisLeft(y)
      .ticks(d3.timeMonth)
      .tickFormat(d3.timeFormat("%b %Y"))
    );

})
