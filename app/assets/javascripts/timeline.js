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

var Chart = function(opts) {
  this.data = opts.data;
  this.width = opts.width;
  this.height = opts.height;
  this.top = opts.top;
  this.bottom = opts.bottom;

  this.draw();
}

Chart.prototype.draw = function(){
  this.element = d3.select("#timeline").append("svg").attr("width", this.width).attr("height", this.height);
  this.createScales();
  this.setupDefs();
  this.friendLine = this.drawLines();
  this.node = this.drawPoints();
  this.updatePoints(this.node.selectAll('.point'));
  this.drawAxis();
}

Chart.prototype.createScales = function(){
  this.x = d3.scaleLinear().domain([0,6]).range([0, this.width]);
  this.y = d3.scaleTime().domain([this.top, this.bottom]).range([0, this.height]);
}

Chart.prototype.setupDefs = function(){
  var fullTime = d3.timeMonths(this.top, this.bottom);

  var defs = this.element.append("defs");
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

  for (var i=0;i<this.data.points.length;i++) {
    var pt = this.data.points[i];

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
}

Chart.prototype.valueline = function(d){
  var dx = this.x(d.target.x) - this.x(d.source.x),
  dy = this.y(d.target.y) - this.y(d.source.y),
  dr = Math.sqrt(dx * dx + dy * dy);
  var dir = d.pos ? '1' : '0';
  var starting = this.x(d.source.x) + "," + this.y(d.source.y);
  var ending = this.x(d.target.x) + "," + this.y(d.target.y)
  return "M" + starting + "A" + dr + "," + dr + " 0 0,"+dir+" " + ending;
}

Chart.prototype.drawLines = function(){
  var _this = this;

  this.element.append("line")
    .attr("class", "me")
    .attr("x1", function(d) { return _this.x(3); })
    .attr("y1", function(d) { return _this.y(_this.top); })
    .attr("x2", function(d) { return _this.x(3); })
    .attr("y2", function(d) { return _this.y(_this.bottom); });

  var friendLine = this.element.selectAll(".line")
      .data(this.data.lines)
    .enter().append("g").attr("class", "line");

  friendLine.append("path")
    .attr("class", "line-segment")
    .attr('stroke', function(d) { return d.friend.color; })
    .attr("x1", function(d) { return _this.x(d.source.x); })
    .attr("y1", function(d) { return _this.y(d.source.y); })
    .attr("x2", function(d) { return _this.x(d.target.x); })
    .attr("y2", function(d) { return _this.y(d.target.y); })
    .attr("d", _this.valueline.bind(_this));

  friendLine.append("path")
    .attr("class", "line-segment-overlay")
    .attr('stroke', 'transparent')
    .attr("x1", function(d) { return _this.x(d.source.x); })
    .attr("y1", function(d) { return _this.y(d.source.y); })
    .attr("x2", function(d) { return _this.x(d.target.x); })
    .attr("y2", function(d) { return _this.y(d.target.y); })
    .attr("d", _this.valueline.bind(_this))
    .on("mouseover", _this.highlightLine.bind(_this))
    .on("mouseout", _this.unHighlightLine.bind(_this))

  return friendLine;
}

Chart.prototype.drawPoints = function() {
  var _this = this;

  var node = this.element.selectAll(".node")
    .data(this.data.points)
  .enter().append("g").attr("class", function(d) { return "node " + d.foursquare_id });

  node.append("rect")
    .attr("class", "point")
    .attr("fill", pointFill)
    .attr("stroke", function(d){ return d.friends[0].color })
    .attr("width", function(d) {return pointsWidth(d.friends.length)})
    .attr("height", function(d) {return pointsWidth(d.friends.length)})
    .attr("x", function(d) { return _this.x(3); })
    .on("mouseover", _this.highlightNode.bind(_this))
    .on("mouseout", _this.unHighlightNode.bind(_this))

  return node;
}

Chart.prototype.updatePoints = function(point){
  var _this = this;

  point
    .attr('transform', function(d){return 'translate(0,-'+((pointsWidth(d.friends.length)/2)+3) +') rotate(45 '+_this.x(3)+' '+_this.y(d.date)+')'})
    .attr("y", function(d) { return _this.y(d.date); });
}

Chart.prototype.drawAxis = function(){
  var _this = this;

  this.element.append("rect")
    .attr("class", "calendar")
    .attr("height", _this.height)
    .attr("fill",  "url(#rainbow-gradient)")
    .on("mousedown", function(d){
      _this.height = 3000;
      var t0 = _this.element.transition().duration(750);
      _this.y.range([0, _this.height]);
      _this.updatePoints(t0.selectAll('.point'))
      t0.selectAll('.line-segment, .line-segment-overlay').attr("d", _this.valueline.bind(_this));
    })

  this.element.append('g')
    .attr('transform', 'translate(50,0)')
    .call(d3.axisLeft(_this.y)
      .ticks(d3.timeMonth)
      .tickFormat(d3.timeFormat("%b %Y"))
    );
}

Chart.prototype.showVenueInfo = function(showNode, d){
  var _this = this;

  var label = showNode.append("g").attr("class", "label");
  label.append("text")
    .text( function(d){return d.venue_name})
    .attr("class", "label-text")
    .attr("transform", "translate(10,0)")
    .attr("x", function(d) { return _this.x(3); })
    .attr("y", function(d) { return _this.y(d.date); })
    .style("filter", "url(#yellow-highlight)");

  if (d) {
    var labelFriends = label.append("text")
      .attr("class", "label-friends")
      .attr("text-anchor", "end")
      .attr("transform", "translate(-15,0)")
      .attr("x", function(d) { return _this.x(3); })
      .attr("y", function(d) { return _this.y(d.date); })
    labelFriends.attr("y", _this.y(d.date) - (d.friends.length*16)/2 - 8);
    for (var i=0;i<d.friends.length;i++) {
      labelFriends.append("tspan")
        .attr("class", "friend-label")
        .attr("x", _this.x(3))
        .attr("dy", "16px")
        .attr("fill", d.friends[i].color)
        .text(d.friends[i].name)
    }
  }
}
Chart.prototype.highlightNode = function(d){
  this.element.selectAll(".line-segment, .point").attr("opacity", "0.3")
  var showNode = this.node.filter(function(p) { return p.foursquare_id === d.foursquare_id });
  showNode.select(".point").attr("opacity", "1");
  this.showVenueInfo(showNode, d)
  var selectedLines = this.friendLine.filter(function(l) {return d.friends.indexOf(l.friend) !== -1 });
  selectedLines.select(".line-segment").attr("opacity", "1").style("stroke-width", "3px")
}
Chart.prototype.unHighlightNode = function(d){
  var showNode = this.node.filter(function(p) { return p.foursquare_id === d.foursquare_id });
  showNode.select(".label").remove()
  this.element.selectAll(".line-segment").attr("opacity", "1").style("stroke-width", "1px");
  this.element.selectAll(".point").attr("opacity", "1").style("stroke-width", "2px");
}
Chart.prototype.highlightLine = function(d){
  this.element.selectAll(".line-segment, .point").attr("opacity", "0.3")
  var showLine = this.friendLine.filter(function(l) { return l.friend.foursquare_id === d.friend.foursquare_id });
  showLine.select(".line-segment").attr("opacity", "1").style("stroke-width", "3px");
  var selectedNodes = this.node.filter(function(l) { return l.friends.indexOf(d.friend) !== -1 });
  this.showVenueInfo(selectedNodes)
  selectedNodes.select(".point").attr("opacity", "1");
  $('<div id="name-card">'+d.friend.name+'</div>')
    .css('color', d.friend.color)
    .css('left', d3.event.pageX-115)
    .css('top', d3.event.pageY-10)
    .appendTo('body');
}
Chart.prototype.unHighlightLine = function(d){
  this.element.selectAll(".line-segment").attr("opacity", "1").style("stroke-width", "1px");
  this.element.selectAll(".point").attr("opacity", "1").style("stroke-width", "2px");
  this.element.selectAll(".label").remove();
  $('#name-card').remove();
}

$(document).ready(function(){
  var data = $('#init-data').data('all');

  var chart = new Chart({
    data: parseData(data.top, data.lines),
    width: $(window).width(),
    height: 40000,
    top: data.top,
    bottom: data.top+data.full_length
  });

})
