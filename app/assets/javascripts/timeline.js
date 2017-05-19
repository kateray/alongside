function parseData(data, bottom) {
  var lineSegments = [];
  var points = [];
  var missed = [];
  for (var i=0;i<(data.length);i++){
    var friend = data[i];
    var l = {
      friend: friend,
      stops: []
    }
    if (friend.checkins.length > 8 && (bottom - friend.checkins[friend.checkins.length-1].date) > 5000000000) {
      missed.push(friend)
    }
    for (var ii=0;ii<(friend.checkins.length);ii++){
      var pt = friend.checkins[ii];
      l.stops.push([3, pt.date]);
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
    lineSegments.push(l)
  }
  return {lines: lineSegments, points: points, missed: missed};
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
  this.user_id = opts.user_id;
  this.current_user = opts.current_user;
  this.secret = opts.secret;
  this.width = opts.width;
  this.height = opts.height;
  this.top = opts.top;
  this.bottom = opts.bottom;
  this.single = opts.single;
  this.tweet_url = opts.tweet_url;
  this.allFriends = opts.single === false ? true : false;
  this.zoomStartPoint = null;

  this.draw();
}

Chart.prototype.draw = function(){
  this.element = d3.select("#timeline").append("svg").attr("width", this.width).attr("height", this.height);
  this.drawNav();
  this.createScales();
  this.setupDefs();
  this.drawLines();
  this.node = this.drawPoints();
  this.updatePoints(this.node.selectAll('.point'));
  this.drawCalendar();
  this.yAxis = this.element.append('g');
  this.drawAxis();
  if (!this.allFriends) {
    this.showVenueInfo(this.node)
  }
}

Chart.prototype.createScales = function(){
  this.x = d3.scaleLinear().domain([0,6]).range([0, this.width]);
  this.y = d3.scaleTime().domain([this.top, this.bottom]).range([0, this.height]);
}

Chart.prototype.setupDefs = function(){
  var fullTime = d3.utcMonths(this.top, this.bottom);
  var days = d3.timeDays(this.top, this.bottom).length;

  var top = this.top

  var defs = this.element.append("defs");
  var filter = defs.append("filter")
    .attr("id", "yellow-highlight")
    .attr("x", "0%")
    .attr("width", "100%");
  filter.append("feFlood")
    .attr("flood-color", "yellow");
  filter.append("feComposite")
    .attr("in", "SourceGraphic");

  var rainbow = defs.append("linearGradient")
    .attr("id", "rainbow-gradient")
    .attr("x2", "0%")
    .attr("y2", "100%");


  var colorMonths = ['#ffffff', '#04f2ff', '#03ff9e', '#03ff46', '#84ff01', '#ddff00', '#ffdd00', '#ff8c00', '#ff4d00', '#ff0073', '#ff01dd', '#7402ff'];

  var m = new Date(this.top).getMonth() -1;
  if (m < 0) {
    m = 12+1;
  }
  rainbow.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", colorMonths[m])

  fullTime.forEach(function(t, i){
    var diff = d3.timeDay.count(top, t);
    var percent = diff/days*100;
    var color = colorMonths[t.getMonth()]
    rainbow.append("stop")
      .attr("offset", percent+'%')
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

Chart.prototype.calculatePathFromPts = function(source, target, dir) {
  var ending = this.x(target[0]) + "," + this.y(target[1]);
  var dx = this.x(target[0]) - this.x(source[0]);
  var dy = this.y(target[1]) - this.y(source[1]);
  var dr = Math.sqrt(dx * dx + dy * dy);
  return "A"+ dr + "," + dr + " 0 0,"+dir+" " + ending;
}

Chart.prototype.valueline = function(d){
  var dir = d.friend.positive ? '1' : '0';
  var starting = this.x(3) + "," + this.y(this.top-1000000000000);
  var pathValue = "M"+starting+this.calculatePathFromPts([3,this.top-1000000000000], d.stops[0], dir);
  for (var i=0;i<d.stops.length-1;i++){
    var source = d.stops[i];
    var target = d.stops[i+1];
    pathValue = pathValue + this.calculatePathFromPts(source, target, dir);
  }
  pathValue = pathValue + this.calculatePathFromPts(d.stops[d.stops.length-1], [3,this.bottom+1000000000000], dir);
  return pathValue;
}

Chart.prototype.drawLines = function(){
  var _this = this;

  this.element.append("line")
    .attr("class", "me")
    .attr("x1", function(d) { return _this.x(3); })
    .attr("y1", function(d) { return _this.y(_this.top); })
    .attr("x2", function(d) { return _this.x(3); })
    .attr("y2", function(d) { return _this.y(_this.bottom); });

  this.element.selectAll(".line-segment")
    .data(this.data.lines)
    .enter().append("path")
    .attr("class", "line-segment")
    .attr("stroke-width", function(d) {return _this.single ? '3px' : '1px'})
    .attr('stroke', function(d) { return d.friend.color; })
    .attr("d", _this.valueline.bind(_this));

  this.element.selectAll(".line-segment-overlay")
    .data(this.data.lines)
    .enter().append("path")
    .attr("class", "line-segment-overlay")
    .attr('stroke', 'transparent')
    .attr("d", _this.valueline.bind(_this))
    .on("mouseover", _this.highlightLine.bind(_this))
    .on("mouseout", _this.unHighlightLine.bind(_this))
    .on("click", _this.selectLine.bind(_this))
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

Chart.prototype.zoomIn = function(){
  this.height = Math.floor(this.height * 1.2);
  this.zoom()
}

Chart.prototype.zoomOut = function(){
  this.height = Math.floor(this.height * 0.8);
  this.zoom()
}

Chart.prototype.zoom = function(){
  var _this = this;
  var t0 = this.element.transition().duration(550);
  this.y.range([0, this.height]);
  this.updatePoints(t0.selectAll('.point'))
  t0.selectAll('.line-segment, .line-segment-overlay').attr("d", _this.valueline.bind(_this));
  t0.selectAll('.me').attr("y2", function(d) { return _this.y(_this.bottom); });
  t0.selectAll('.calendar').attr("height", _this.height);
  if (this.single) {
    t0.selectAll(".label-text").attr("y", function(d) { return _this.y(d.date); })
  }
  this.drawAxis();
  t0.attr("height", this.height);
}

Chart.prototype.togglePrivacy = function(){
  var _this = this;
  var val = !this.secret;
  d3.request("/users/privacy").header("Content-Type", "application/json").post(JSON.stringify({user: {secret: val}}), function(response){
    _this.secret = val;
    _this.updatePrivacyButton();
  });
}

Chart.prototype.updatePrivacyButton = function(){
  var symbol = this.secret ? "<img src='/assets/lock.png' />" : "<img src='/assets/unlock.png' />";
  var text = this.secret ? "make public" : "make private";
  var privacyMessage = this.secret ? "This page is private right now." : "This page is public. Share it! <a href="+this.tweet_url+" target='_blank'><img src='/assets/twitter-small.png' /></a>";

  if (this.secret || this.single) {
    d3.selectAll('.big_text, #reconnect').attr("style", "display:none")
  } else {
    d3.selectAll('.big_text, #reconnect').attr("style", "display:block")
    if (this.data.missed.length > 0) {
      var friend = this.data.missed[Math.floor(Math.random()*this.data.missed.length)]
      d3.select('#reconnect')
        .attr("style", "color:"+friend.color)
        .html("Friends are important. Why don't you give " + friend.name + " a call?")
    }
  }
  d3.selectAll(".privacy")
    .html(symbol)

  d3.selectAll(".privacy-message")
    .html(privacyMessage)

  d3.selectAll(".privacy-things")
    .on("mouseover", function(){d3.selectAll('.privacy').html(text); d3.selectAll(".privacy-container").classed("hidden", false);})
    .on("mouseleave", function(){d3.selectAll('.privacy').html(symbol); d3.selectAll(".privacy-container").classed("hidden", true);});
}

Chart.prototype.drawNav = function(){
  var _this = this;
  d3.selectAll(".nav").remove();

  var nav = d3.select("body").append("div")
    .attr("class", "nav")

  if (this.current_user) {
    if (!this.single && this.current_user === this.user_id) {
      nav.append("div")
        .attr("class", "nav-button privacy privacy-things")
        .on("click", _this.togglePrivacy.bind(this));

      nav.append("a")
        .attr("href", "/loading")
        .attr("class", "nav-button refresh")
        .html("<img src='/assets/refresh.png' />")
        .on("mouseover", function(){d3.select(this).html("refresh data")})
        .on("mouseleave", function(){d3.select(this).html("<img src='/assets/refresh.png' />")})
    } else {
      nav.append("a")
        .attr("href", "/u/"+this.user_id)
        .attr("class", "nav-button home")
        .html("<img src='/assets/home.png' />")
        .on("mouseover", function(){d3.select(this).html("home")})
        .on("mouseleave", function(){d3.select(this).html("<img src='/assets/home.png' />")})
    }

    nav.append("a")
      .attr("href", "/logout")
      .attr("class", "nav-button logout")
      .html("<img src='/assets/exit.png' />")
      .on("mouseover", function(){d3.select(this).html("logout")})
      .on("mouseleave", function(){d3.select(this).html("<img src='/assets/exit.png' />")})

    nav.append("div")
      .attr("class", "privacy-container hidden privacy-things")
      .append("div")
      .attr("class", "privacy-message")

    this.updatePrivacyButton()
  } else {
    nav.append("div")
      .attr("class", "nav-button login")
      .html("Want your own timeline? ")
      .append("a")
        .attr("href", "/auth/foursquare")
        .html("Sign in with Foursquare")
  }
}


Chart.prototype.drawCalendar = function(){
  var _this = this;

  d3.select("body").append("div")
    .attr("class", "zoom-button minus")
    .html('-')
    .on("mouseover", function(){d3.select(this).html("zoom out")})
    .on("mouseleave", function(){d3.select(this).html("-")})
    .on("click", _this.zoomOut.bind(this))
  d3.select("body").append("div")
    .attr("class", "zoom-button plus")
    .html('+')
    .on("mouseover", function(){d3.select(this).html("zoom in")})
    .on("mouseleave", function(){d3.select(this).html("+")})
    .on("click", _this.zoomIn.bind(this))

  this.element.append("rect")
    .attr("class", "calendar")
    .attr("height", _this.height)
    .attr("fill",  "url(#rainbow-gradient)");
}

Chart.prototype.drawAxis = function(){
  var _this = this;

  this.yAxis
    .attr("class", "y-axis")
    .attr('transform', 'translate(45,0)')
    .call(d3.axisLeft(_this.y)
      .ticks(d3.timeMonth)
      .tickFormat(d3.timeFormat("%b"))
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
  if (this.single) {
    return;
  }
  this.element.selectAll(".line-segment, .point").attr("opacity", "0.3")
  var showNode = this.node.filter(function(p) { return p.foursquare_id === d.foursquare_id });
  showNode.select(".point").attr("opacity", "1");
  this.showVenueInfo(showNode, d)
  var selectedLines = this.element.selectAll(".line-segment").filter(function(l) {return d.friends.indexOf(l.friend) !== -1 });
  selectedLines.attr("opacity", "1").style("stroke-width", "3px")
}
Chart.prototype.unHighlightNode = function(d){
  if (this.single) {
    return;
  }
  this.element.selectAll(".label").remove()
  this.element.selectAll(".line-segment").attr("opacity", "1").style("stroke-width", "1px");
  this.element.selectAll(".point").attr("opacity", "1");
}
Chart.prototype.highlightLine = function(d){
  this.element.append("text")
    .attr("class", "name-card")
    .text(d.friend.name)
    .attr("text-anchor", "end")
    .attr("fill", d.friend.color)
    .attr("x", function(d) { return d3.event.pageX-12 })
    .attr("y", function(d) { return d3.event.pageY-6 });
  if (this.single) {
    return;
  }
  this.element.selectAll(".line-segment, .point").attr("opacity", "0.3")
  var showLine = this.element.selectAll(".line-segment").filter(function(l) { return l.friend.foursquare_id === d.friend.foursquare_id });
  showLine.attr("opacity", "1").style("stroke-width", "3px");
  var selectedNodes = this.node.filter(function(l) { return l.friends.indexOf(d.friend) !== -1 });
  this.showVenueInfo(selectedNodes)
  selectedNodes.select(".point").attr("opacity", "1");
}
Chart.prototype.unHighlightLine = function(d){
  this.element.selectAll('.name-card').remove();
  if (this.single) {
    return;
  }
  this.element.selectAll(".line-segment").attr("opacity", "1").style("stroke-width", "1px");
  this.element.selectAll(".point").attr("opacity", "1");
  this.element.selectAll(".label").remove();
}
Chart.prototype.selectLine = function(d){
  var _this = this;
  if (this.allFriends && this.current_user === this.user_id) {
    if (this.single) {
      window.history.pushState(null, null, "/u/" + this.user_id)
      this.single = false;
      this.drawNav();
      this.element.selectAll(".line-segment").attr("opacity", "1").style("stroke-width", "1px");
      this.element.selectAll(".point").classed("hidden", false)
      this.element.selectAll(".line-segment-overlay").attr("pointer-events", "auto")
      d3.selectAll(".label, .back-button, .share-friend-message").remove();
    } else {
      window.history.pushState(null, null, "/f/" + d.friend.url_id)
      this.single = true;
      this.drawNav();
      this.element.selectAll(".line-segment").attr("opacity", "0")
      this.element.selectAll(".point").classed("hidden", true)
      this.element.selectAll(".line-segment-overlay").attr("pointer-events", "none")
      this.element.selectAll(".line-segment").filter(function(l) { return l.friend.foursquare_id === d.friend.foursquare_id }).attr("opacity", "1").style("stroke-width", "3px");
      this.element.selectAll(".line-segment-overlay").filter(function(l) { return l.friend.foursquare_id === d.friend.foursquare_id }).attr("pointer-events", "auto");
      var selectedNodes = this.node.filter(function(l) { return l.friends.indexOf(d.friend) !== -1 });
      this.showVenueInfo(selectedNodes)
      selectedNodes.select(".point").classed("hidden", false);
      function calcStyle(){
        var style = "color: "+d.friend.color+";";
        if (d.friend.positive) {
          style = style + "left: 9%;";
        } else {
          style = style + "right: 7.5%;";
        }
        return style;
      }
      function genMessage(){
        var times = d.friend.checkins.length;
        var format = d3.timeFormat("%B %e, %Y");
        var date = format(d.friend.checkins[0].date);
        var msg = "You and "+d.friend.name+" have checked in together ";
        msg = msg + times + (times > 1 ? " times " : " time ");
        msg = msg + "since "+date+". ";
        msg = msg + "Why don't you share <a href='"+window.location.href+"'>this page</a> with them?";
        return msg;
      }
      d3.select("body").append("div")
        .attr("class", "back-button")
        .attr("style", "color:"+d.friend.color)
        .html("&#x2190; Back to all friends")
        .on("click", _this.selectLine.bind(_this))
      d3.select("body").append("div")
        .attr("class", "share-friend-message")
        .attr("style", calcStyle)
        .html(genMessage)
      .append("div")
        .attr("class", "share-friend-message-close")
        .html("&times; hide")
        .on("click", function(){d3.selectAll(".share-friend-message").remove();})
    }
  }

}

var data = JSON.parse(document.getElementById("init-data").dataset.all);
var chart = new Chart({
  data: parseData(data.lines, data.top+data.full_length),
  single: data.single,
  width: window.innerWidth-15,
  height: Math.floor((data.full_length+400000000)/5000000),
  top: data.top-200000000,
  bottom: data.top+data.full_length+200000000,
  user_id: data.user_id,
  current_user: data.current_user,
  secret: data.secret,
  tweet_url: data.tweet_url
});
