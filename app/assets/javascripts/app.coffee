prettifyDate = (date) ->
  months = []
  months[months.length] = "January"
  months[months.length] = "February"
  months[months.length] = "March"
  months[months.length] = "April"
  months[months.length] = "May"
  months[months.length] = "June"
  months[months.length] = "July"
  months[months.length] = "August"
  months[months.length] = "September"
  months[months.length] = "October"
  months[months.length] = "November"
  months[months.length] = "December"

  days = []
  days[days.length] = "Sunday"
  days[days.length] = "Monday"
  days[days.length] = "Tuesday"
  days[days.length] = "Wednesday"
  days[days.length] = "Thursday"
  days[days.length] = "Friday"
  days[days.length] = "Saturday"

  str = ''
  str = str + days[date.getDay()] + ', ' + months[date.getMonth()] + ' ' + date.getDate()

  return str

prettifyTime = (date) ->
  str = ''
  hour = date.getHours()
  if hour == 0
    hour = 12
    m = 'am'
  else if hour < 12
    m = 'am'
  else if hour == 12
    m = 'pm'
  else
    hour = hour - 12
    m = 'pm'

  minutes = date.getMinutes()
  if minutes < 10
    minutes = '0' + minutes

  str = str + hour + ':' + minutes + m

  return str

drawMonth = (date, calendarHeight, zoom, top)->
  if date.getMonth()%2 == 0
      color = '#f2f2f2'
    else
      color = '#ffffff'

  prevDate = calendarHeight*1000*zoom+top*1000
  height = (date - prevDate)/1000/zoom
  $strip = $('<div class="month">')
  $strip.css('height', height).css('background', color)
  $('#timeline').append($strip)

  months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  $month_name = $('<div class="month_name">')
  $month_name.text months[date.getMonth()-1]
  $strip.append($month_name)
  
  $month_year = $('<div class="month_year">')
  $month_year.text date.getFullYear()
  $strip.append($month_year)

  return height

drawTimeline = (initData) ->
  $('#timeline').html('')

  zoom = initData.zoom
  length = initData.length/zoom
  top = initData.top
  single = false

  #set up calendar background
  date = new Date top*1000
  date.setDate(1)
  date.setHours(0)
  date.setMinutes(0)
  date.setSeconds(0)

  calendarHeight = 0
  while calendarHeight < length
    date.setMonth(date.getMonth()+1)
    calendarHeight = calendarHeight + drawMonth(date, calendarHeight, zoom, top)

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
    totalLength = 0
    skrollr = {}

    calculateNewControlPoints = (y, yprev) ->
      distance = y - yprev
      y1 = yprev + distance/2
      x1 = x + distance/3*p

      totalLength = totalLength + Math.sqrt(distance*distance + x1*x1)
      skrollr[y] = totalLength

      return [x1, y1, x, y]

    _.each friend['time'], (time) ->
      y = (time - top)/zoom
      points.push calculateNewControlPoints(y, yprev)
      yprev = y

    #set final y off the page
    # y = length + (length - yprev)*2
    y = length + length/10
    points.push calculateNewControlPoints(y, yprev)
    
    path = "M" + xstart.toString() + "," + ystart.toString() + "Q" + points.join()
    line = paper.path(path)

    lineLength = line.node.getTotalLength()

    line.attr
      fill: 'none',
      stroke: friend['color'],
      'stroke-width': '4',

    $(line.node).attr('class', 'friend')

    #set up scroll to reveal
    $(line.node).attr('stroke-dasharray', lineLength)
    $(line.node).attr('data-0', 'stroke-dashoffset:' + lineLength + ';')
    _.each skrollr, (k, v) ->
      # debugger
      # k = parseInt(k)
      # v = 
      # $(line.node).attr('data-' + parseInt(k).toString(), 'stroke-dashoffset:' + parseInt(lineLength - v).toString() + ';')
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

    line.click (e) ->
      if single == false
        single = true
        $('.friend').hide()
        $(line.node).show()
      else
        single = false
        $('.friend').show()

  #set up overlap points
  # hovercard_template = '<div id="place"><%= venue_name %></div><div id="date"><%= date %></div><div id="time"><%= time %></div><div id="shout"><%= shout %></div>'
  _.each initData['points'], (point) ->
    y = (point.time - top)/zoom
    circle = paper.circle(x, y, 6)
    circle.attr({fill: '#474747'})
    circle.attr('stroke-width', 0)
    $(circle.node).attr('class', 'overlap')
    $(circle.node).attr('data-' + parseInt(y-400).toString(), 'opacity:0;')
    $(circle.node).attr('data-' + parseInt(y-100).toString(), 'opacity:1;')

    #show metadata on hover
    circle.hover ( (e) ->
      @g = @glow({width:3})
      date = new Date(point.time*1000)
      $('#hovercard').css('left', e.pageX+15).css('top', e.pageY)
        # .text(prettifyDate(date) + ' ' + prettifyTime(date) + ' ' + point.venue_name)
      template = _.template $('#hovercardTemplate').html(), {
        venue_name: point.venue_name,
        date: prettifyDate(date),
        time: prettifyTime(date),
        shout: point.shout }
      $('#hovercard').html(template).show()

    ), ->
      @g.remove()
      $('#hovercard').hide()

  skrollr.init forceHeight: false

showLockImage = (secret) ->
  if secret == true
    $('.locked').show()
    $('.unlocked').hide()
  else
    $('.unlocked').show()
    $('.locked').hide()

$(document).ready ->
  initData = JSON.parse($('#init-data').val())

  showLockImage initData.secret

  drawTimeline initData

  $('.zoom_button').click ->
    if $(this).data('zoom') == 'in'
      initData.zoom = initData.zoom*2
    else
      initData.zoom = initData.zoom/2
    drawTimeline initData

  $('#toggle_privacy').click ->
    val = !initData.secret
    $.ajax
      type: "PUT"
      url: "/users/privacy"
      data: {user: {secret: val}}
      success: (data) =>
        initData.secret = val
        showLockImage initData.secret
        $('#message').html data
