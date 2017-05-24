var xmlhttp;
xmlhttp = new XMLHttpRequest();
xmlhttp.onreadystatechange = function(){
  if (xmlhttp.readyState == 4 && xmlhttp.status == 200){
    window.location = JSON.parse(xmlhttp.responseText)['url']
  }
}
xmlhttp.open("GET", "/overlaps?x=10", true);
xmlhttp.send();
