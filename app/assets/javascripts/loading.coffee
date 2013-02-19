$(document).ready ->
  $.ajax
    type: "GET"
    url: "/overlaps"
    success: (data) =>
      window.location = data['url']