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

$(document).ready(function(){
  var data = $('#init-data').data('all');
  var parsedData = parseData(data.top, data.lines)
  var width = $(window).width()-2;
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

  function pointsWidth(l){
    return l*3 + 7;
  }

  var svg = d3.select("#timeline").append("svg").attr("width", width).attr("height", height);

  var defs = svg.append("defs");
  var filter = defs.append("filter")
    .attr("id", "drop-shadow")
    .attr("x", "0%")
    .attr("width", "100%");

  filter.append("feFlood")
    .attr("flood-color", "yellow");

  filter.append("feComposite")
    .attr("in", "SourceGraphic");


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

  function pointFill(d) {
    if (d.friends.length === 1) {
      return '#fff';
    } else {
      return "url(#gradient-"+d.foursquare_id+")";
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

  friendLine.append("path")
    .attr("class", "line-segment-overlay")
    .attr('stroke', 'transparent')
    .attr("x1", function(d) { return x(d.source.x); })
    .attr("y1", function(d) { return y(d.source.y); })
    .attr("x2", function(d) { return x(d.target.x); })
    .attr("y2", function(d) { return y(d.target.y); })
    .attr("d", valueline)
    .on("mouseover", function(d) {
      svg.selectAll(".line-segment, .point").attr("opacity", "0.3")
      var showLine = friendLine.filter(function(l) { return l.friend.foursquare_id === d.friend.foursquare_id });
      showLine.select(".line-segment").attr("opacity", "1").style("stroke-width", "3px");
      var selectedNodes = node.filter(function(l) { return l.friends.indexOf(d.friend) !== -1 });
      selectedNodes.select(".label").attr("display", "block");
      selectedNodes.select(".point").attr("opacity", "1");
      $('<div id="name-card">'+d.friend.name+'</div>')
        .css('color', d.friend.color)
        .css('width', 100)
        .css('left', d3.event.pageX-115)
        .css('top', d3.event.pageY-10)
        .appendTo('body');
    })
    .on("mouseout", function(d) {
      svg.selectAll(".line-segment").attr("opacity", "1").style("stroke-width", "1px");
      svg.selectAll(".point").attr("opacity", "1").style("stroke-width", "2px");
      svg.selectAll(".label").attr("display", "none");
      $('#name-card').remove()
    })

  var node = svg.selectAll(".node")
    .data(parsedData.points)
  .enter().append("g").attr("class", function(d) { return "node " + d.foursquare_id });

  var point = node.append("rect")
    .attr("class", "point")
    .attr('transform', function(d){return 'translate(0,-'+((pointsWidth(d.friends.length)/2)+3) +') rotate(45 '+x(3)+' '+y(d.date)+')'})
    .attr("fill", pointFill)
    .attr("stroke", function(d){ return d.friends[0].color })
    .attr("width", function(d) {return pointsWidth(d.friends.length)})
    .attr("height", function(d) {return pointsWidth(d.friends.length)})
    .attr("x", function(d) { return x(3); })
    .attr("y", function(d) { return y(d.date); })
    .on("mouseover", function(d) {
      svg.selectAll(".line-segment, .point").attr("opacity", "0.3")
      var showNode = node.filter(function(p) { return p.foursquare_id === d.foursquare_id });
      showNode.select(".point").attr("opacity", "1");
      showNode.select(".label").attr("display", "block");
      var labelFriends = showNode.select(".label").append("text")
        .attr("class", "label-friends")
        .attr("text-anchor", "end")
        .attr("transform", "translate(-15,0)")
        .attr("x", function(d) { return x(3); })
        .attr("y", function(d) { return y(d.date); })
      labelFriends.attr("y", y(d.date) - (d.friends.length*16)/2 - 8)
      for (var i=0;i<d.friends.length;i++) {
        labelFriends.append("tspan")
          .attr("class", "friend-label")
          .attr("x", x(3))
          .attr("dy", "16px")
          .attr("fill", d.friends[i].color)
          .text(d.friends[i].name)
      }
      var selectedLines = friendLine.filter(function(l) {return d.friends.indexOf(l.friend) !== -1 });
      selectedLines.select(".line-segment").attr("opacity", "1").style("stroke-width", "3px")
    })
    .on("mouseout", function(d) {
      var showNode = node.filter(function(p) { return p.foursquare_id === d.foursquare_id });
      showNode.select(".label-friends").remove()
      svg.selectAll(".label").attr("display", "none");
      svg.selectAll(".line-segment").attr("opacity", "1").style("stroke-width", "1px");
      svg.selectAll(".point").attr("opacity", "1").style("stroke-width", "2px");
    });

  var label = node.append("g")
    .attr("class", "label")
    .attr("display", 'none');

  label.append("text")
    .text( function(d){return d.venue_name})
    // .text( function(d){return d.venue_name + ', with ' + d.friends.map(function(f){return f.name}).join(', ')})
    .attr("class", "label-text")
    .attr("transform", "translate(10,0)")
    .attr("x", function(d) { return x(3); })
    .attr("y", function(d) { return y(d.date); })
    .style("filter", "url(#drop-shadow)");


  svg.append('g')
    .attr('transform', 'translate(100,0)')
    .call(d3.axisLeft(y)
      .ticks(1000)
      .tickFormat(d3.timeFormat("%B %e %Y"))
    );
})
