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

  var svg = d3.select("#timeline").append("svg").attr("width", width).attr("height", height);

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
        .css('left', d3.event.pageX+15)
        .css('top', d3.event.pageY)
        .appendTo('body');
    })
    .on("mouseout", function(d) {
      svg.selectAll(".line-segment, .point").attr("opacity", "1").style("stroke-width", "1px");
      svg.selectAll(".label").attr("display", "none");
      $('#name-card').remove()
    })

  var node = svg.selectAll(".node")
    .data(parsedData.points)
  .enter().append("g").attr("class", function(d) { return "node " + d.foursquare_id });

  var point = node.append("circle")
    .attr("class", "point")
    .attr("fill", function(d) { return d.friends[0].color; })
    .attr("r", 5)
    .attr("cx", function(d) { return x(3); })
    .attr("cy", function(d) { return y(d.date); });

  var label = node.append("text")
    .attr("class", "label")
    .text( function(d){return d.venue_name})
    .attr("display", 'none')
    .attr("x", function(d) { return x(3); })
    .attr("y", function(d) { return y(d.date); });

  point.on("mouseover", function(d) {
    var showNode = node.filter(function(p) { return p.foursquare_id === d.foursquare_id });
    showNode.select(".label").attr("display", "block");
    svg.selectAll(".line-segment, .point").attr("opacity", "0.3")
    var selectedLines = friendLine.filter(function(l) {return d.friends.indexOf(l.friend) !== -1 });
    selectedLines.select(".line-segment").attr("opacity", "1").style("stroke-width", "3px")
  })

  point.on("mouseout", function(d) {
    svg.selectAll(".label").attr("display", "none");
    svg.selectAll(".line-segment, .point").attr("opacity", "1").style("stroke-width", "1px");
  })

  svg.append('g')
    .attr('transform', 'translate(100,0)')
    .call(d3.axisLeft(y)
      .ticks(1000)
      .tickFormat(d3.timeFormat("%B %e %Y"))
    );
})
