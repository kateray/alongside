// function parseData(data){
//   var links = [];
//   for (var i=0;i<(data.length-1);i++){
//     var l = {source: {x: 3, y: data[i].date}, target: {x: 3, y: data[i+1].date}, line: data[i]}
//     links.push(l)
//   }
//   return links;
// }

function parseData(top, data) {
  var points = [];
  for (var i=0;i<(data.length-1);i++){
    var line = data[i];
    var pos = i%2 === 0;
    for (var ii=0;ii<(line.checkins.length-1);ii++){
      var pt = line.checkins[ii];
      var sourceDate = ii === 0 ? top-1000000000000 : line.checkins[ii-1].date;
      var l = {
        pos: pos,
        date: pt.date,
        venue_name: pt.venue_name,
        source: {x: 3, y: sourceDate},
        target: {x: 3, y: pt.date},
        line: line
      }
      points.push(l)
    }
  }
  return points;
}

$(document).ready(function(){
  var data = $('#init-data').data('all');
  var lines = parseData(data.top, data.lines)
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

  svg.append("g")

  var node = svg.selectAll(".node")
    .data(lines)
  .enter().append("circle")
    .attr("class", "node")
    .attr("fill", function(d) { return d.line.color; })
    .attr("r", 5)
    .attr("cx", function(d) { return x(3); })
    .attr("cy", function(d) { return y(d.date); });

  node.on("mouseover", function(d) {
    $('<div id="hover-card"><div class="place">'+d.venue_name+'</div><div class="date">'+d.date+'</div></div>')
      .css('left', d3.event.pageX+15)
      .css('top', d3.event.pageY)
      .appendTo('body');
  })

  node.on("mouseout", function(d) {
    $('#hover-card').remove()
  })

  var link = svg.selectAll(".link")
      .data(lines)
    .enter().append("path")
      .attr("class", "line")
      .attr('stroke', function(d) { return d.line.color; })
      .attr("x1", function(d) { return x(d.source.x); })
      .attr("y1", function(d) { return y(d.source.y); })
      .attr("x2", function(d) { return x(d.target.x); })
      .attr("y2", function(d) { return y(d.target.y); })
      .attr("d", valueline);

  link.on("mouseover", function(d) {
    d3.select(this).style('stroke-width', '4px');
    $('<div id="name-card">'+d.line.name+'</div>')
      .css('color', d.line.color)
      .css('left', d3.event.pageX+15)
      .css('top', d3.event.pageY)
      .appendTo('body');
  })

  link.on("mouseout", function(d) {
    d3.select(this).style('stroke-width', '2px');
    $('#name-card').remove()
  })

  svg.append('g')
    .attr('transform', 'translate('+width/2+',0)')
    .call(d3.axisLeft(y)
      .ticks(1000)
      .tickFormat(d3.timeFormat("%B %e %Y"))
    );
})
