$(document).ready ->
  unless $('body').data('page') == 'loading'
    return
  uri = window.location.href
  x = parseUri(uri).queryKey['x'] || 10
  $.ajax
    type: "GET"
    url: "/overlaps"
    data: {x : x}
    success: (data) =>
      window.location = data['url']