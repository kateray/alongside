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

drawMonth = (date, calendarHeight)->
  if date.getMonth()%2 == 0
      color = '#f2f2f2'
    else
      color = '#ffffff'

  prevDate = calendarHeight*1000*Timeline.zoom+Timeline.top*1000
  height = (date - prevDate)/1000/Timeline.zoom
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

drawLine = (friend, index) ->
  #set x polarity to alternate lines left and right
  if index%2
    p = -1
  else
    p = 1

  #initial x value 1/2 of x
  xstart = Timeline.x + Timeline.x/2*p
  #initial y value off the page
  #TODO surely this can be refactored
  first = (friend['checkins'][0]['time'] - Timeline.top)/Timeline.zoom + Timeline.offset
  ystart = -1*first

  yprev = ystart
  points = []

  calculateNewControlPoints = (y, yprev) ->
    distance = y - yprev
    y1 = yprev + distance/2
    x1 = Timeline.x + distance/3*p

    return [x1, y1, Timeline.x, y]

  _.each friend['checkins'], (checkin) ->
    y = (checkin['time'] - Timeline.top)/Timeline.zoom + Timeline.offset
    points.push calculateNewControlPoints(y, yprev)
    yprev = y

  if friend['checkins'].length > 8 && (Timeline.length - yprev)*Timeline.zoom > 1000000
    Timeline.missed.push(friend)

  #set final y off the page
  y = Timeline.length + (Timeline.length - yprev)*2

  points.push calculateNewControlPoints(y, yprev)
  
  path = "M" + xstart.toString() + "," + ystart.toString() + "Q" + points.join()
  line = Timeline.paper.path(path)

  line.attr
    stroke: friend['color'],
    'stroke-width': '4',

  $(line.node).attr('class', 'friend')

  setupSkrollrMetadata line
  
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

  if Timeline.action == 'show'
    line.click (e) ->
      if Timeline.single == false
        Timeline.single = friend.url_id
        window.history.pushState(null, null, "/f/" + friend.url_id)
        $('#toggle_privacy').hide()
        drawTimeline()
      else
        Timeline.single = false
        window.history.pushState(null, null, "/u/" + Timeline.user_id)
        $('#toggle_privacy').show()
        drawTimeline()

setupSkrollrMetadata = (line) ->
  lineLength = line.node.getTotalLength()

  $(line.node).attr('stroke-dasharray', lineLength)
  $(line.node).attr('data-0', 'stroke-dashoffset:' + lineLength + ';')

  num = 500
  while num < lineLength + 500
    pt = parseInt(line.getPointAtLength(num).y)
    l = lineLength - num - 400
    $(line.node).attr('data-' + pt.toString(), 'stroke-dashoffset:' + l.toString() + ';')
    num = num + 500

drawTimeline = ->
  $('#timeline').html('')

  Timeline.length = Timeline.full_length/Timeline.zoom + Timeline.offset

  #set up calendar background
  date = new Date Timeline.top*1000
  date.setDate(1)
  date.setHours(0)
  date.setMinutes(0)
  date.setSeconds(0)

  calendarHeight = 0
  $strip = $('<div class="month">')
  $strip.css('height', Timeline.offset).css('background', 'white')
  $('#timeline').append($strip)
  while calendarHeight < Timeline.length-Timeline.offset
    date.setMonth(date.getMonth()+1)
    calendarHeight = calendarHeight + drawMonth(date, calendarHeight)
  $('#future').css 'background', $('.month:last').css('background')

  #set up svg lines
  if Timeline.length > 2000
    width = $('body').width()
  else
    width = Timeline.length/2
  Timeline.x = width/2

  #set up canvas
  $('#timeline').append('<div id="paper">')

  Timeline.paper = Raphael document.getElementById("paper"), width, Timeline.length

  #draw vertical 'me' line
  me = Timeline.paper.path("M" + Timeline.x.toString() + ",0L" + Timeline.x.toString() + ","+ Timeline.length.toString())
  me.attr('stroke', '#47bad9')
  me.attr('stroke-width', '7')

  setupSkrollrMetadata me

  if Timeline.single
    line = _.where(Timeline.lines, {url_id : Timeline.single})[0]
    index = _.indexOf(Timeline.lines, line)
    drawLine line, index
  else
    _.each Timeline['lines'], (friend, index) ->
      drawLine(friend, index)

  #set up overlap points
  _.each Timeline['points'], (point) ->
    if Timeline.single && _.where(point.friends, {url_id : Timeline.single}).length == 0
      return
    y = (point.time - Timeline.top)/Timeline.zoom + Timeline.offset
    circle = Timeline.paper.circle(Timeline.x, y, 6)
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
      friends = ''
      _.each point.friends, (f, index) ->
        if index == 0
          friends = friends + f.name
        else
          friends = friends + ', ' + f.name
      template = _.template $('#hovercardTemplate').html(), {
        venue_name: point.venue_name,
        date: prettifyDate(date),
        time: prettifyTime(date),
        shout: point.shout,
        friends: friends}
      $('#hovercard').html(template).show()

    ), ->
      @g.remove()
      $('#hovercard').hide()

  unless Timeline.missed.length == 0
    friend = Timeline.missed[Math.floor(Math.random()*Timeline.missed.length)]
    $('#future')
      .css('color', friend.color)
      .text "Friends are important. Why don't you give " + friend.name + " a call?"
  skrollr.init forceHeight: false

showLockImage = (secret) ->
  if secret == true
    $('.locked').show()
    $('.unlocked').hide()
  else
    $('.unlocked').show()
    $('.locked').hide()

$(document).ready ->
  unless $('#meta').data('page') == 'show'
    return
  $('.twitter-share-button').attr 'data-url', window.location.origin + window.location.pathname
  window.Timeline = JSON.parse($('#init-data').val())
  Timeline.offset = 500
  Timeline.zoom = parseUri(window.location.href).queryKey['zoom'] || 1000
  Timeline.missed = []

  showLockImage Timeline.secret

  drawTimeline()

  $('.zoom_button').click ->
    if $(this).data('zoom') == 'in'
      Timeline.zoom = Timeline.zoom*2
    else
      Timeline.zoom = Timeline.zoom/2
    window.history.pushState(null, null, window.location.origin + window.location.pathname + '?zoom=' + Timeline.zoom)
    drawTimeline()

  $('#timeline').click ->
    $('.message').hide()

  $('#toggle_privacy').click (e) ->
    val = !Timeline.secret
    $.ajax
      type: "PUT"
      url: "/users/privacy"
      data: {user: {secret: val}}
      success: (data) =>
        Timeline.secret = val
        showLockImage Timeline.secret
        $('.message').hide()
        if val == true
          $('#private_message.message').show()
        else
          $('#public_message.message').show()
