drawMonth = (date, calendarHeight, zoom)->
  if date.getMonth()%2 == 0
      color = '#f2f2f2'
    else
      color = '#ffffff'

  date.setMonth(date.getMonth()+1)
  height = (date - calendarHeight*1000*1000)/1000/1000/zoom
  $strip = $('<div class="month">')
  $strip.css('height', height).css('background', color)
  $('#timeline').append($strip)

  months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  $month_name = $('<div class="month_name">')
  $month_name.text months[date.getMonth()]
  $strip.append($month_name)
  
  $month_year = $('<div class="month_year">')
  $month_year.text date.getFullYear()
  $strip.append($month_year)

  return height

drawTimeline = (initData) ->
  $('#timeline').html('')

  zoom = initData.zoom
  length = initData.length/zoom

  #set up calendar background
  date = new Date initData.top*1000
  date.setDate(1)
  date.setHours(0)
  date.setMinutes(0)
  date.setSeconds(0)

  calendarHeight = drawMonth(date, 0, zoom)

  while calendarHeight < length
    calendarHeight = calendarHeight + drawMonth(date, calendarHeight, zoom)

  #set up svg lines
  if length > 2000
    width = $('body').width()
  else
    width = length/2
  x = width/2

  #set up canvas
  $('#timeline').append('<div id="paper">')
  paper = Raphael document.getElementById("paper"), width, length

  #draw vertical 'me' line
  me = paper.path("M" + x.toString() + ",0L" + x.toString() + ","+ (length).toString())
  me.attr('stroke', '#47bad9')
  me.attr('stroke-width', '7')

  _.each initData['lines'], (friend, index) ->

    #set x polarity to alternate lines left and right
    if index%2
      p = 1
    else
      p = -1

    #initial x value 1/2 of x
    xstart = x + x/2*p
    #initial y value off the page
    ystart = length/-10

    yprev = ystart
    points = []

    calculateNewControlPoints = (y, yprev) ->
      distance = y - yprev
      y1 = yprev + distance/2
      x1 = x + distance/3*p
      return [x1, y1, x, y]

    _.each friend['time'], (time) ->
      y = time/zoom
      points.push calculateNewControlPoints(y, yprev)
      yprev = y

    #set final y off the page
    y = length + length/10
    points.push calculateNewControlPoints(y, yprev)
    
    path = "M" + xstart.toString() + "," + ystart.toString() + "Q" + points.join()
    line = paper.path(path)

    lineLength = line.node.getTotalLength()

    line.attr
      fill: 'none',
      stroke: friend['color'],
      'stroke-width': '4',

    $(line.node).css('cursor', 'pointer')

    #set up scroll to reveal
    $(line.node).attr('stroke-dasharray', lineLength)
    $(line.node).attr('data-0', 'stroke-dashoffset:' + lineLength + ';')
    $(line.node).attr('data-end', 'stroke-dashoffset:0;')
    
    #show metadata on hover
    line.hover ( (e) ->
      @g = @glow({width:2})
      $('#info')
        .text(friend.name)
        .css('left', e.pageX+15).css('top', e.pageY)
        .css('color', friend.color)

    ), ->
      @g.remove()
      $('#info').text ''

  skrollr.init forceHeight: false

$(document).ready ->
  initData = JSON.parse($('#init-data').val())

  drawTimeline initData

  $('.zoom_button').click ->
    if $(this).data('zoom') == 'in'
      initData.zoom = initData.zoom*2
    else
      initData.zoom = initData.zoom/2
    drawTimeline initData