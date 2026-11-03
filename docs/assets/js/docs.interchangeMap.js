// Loads the Google Map for the Interchange example after the first image
// swap on a large viewport.
// 7.0 chrome re-skin (unit 3): jQuery-free port. The zf event arrives as a
// real bubbling CustomEvent — listen for the bare type, check e.namespace.

!function() {

var loaded = false;

var loadScript = function(src, onload) {
  var script = document.createElement('script');
  script.src = src;
  script.onload = onload;
  document.head.appendChild(script);
};

var el = document.getElementById('docs-example-interchange');
if (el) {
  el.addEventListener('replaced', function(e) {
    // the Events layer joins namespaces SORTED ('zf.interchange' → 'interchange.zf')
    if (e.namespace !== 'interchange.zf') return;
    if (!Foundation.MediaQuery.atLeast('large')) return;
    if (!loaded) {
      loadScript('https://maps.googleapis.com/maps/api/js?key=AIzaSyBOVwxUM9akvFrSWmmb2iKc7Fe0vjRBY7c&sensor=false&callback=initializeMaps', function() {
        loaded = true;
      });
    } else {
      window.initializeMaps();
    }
  });
}

window.initializeMaps = function() {
  // Basic options for a simple Google Map
  // For more options, see: https://developers.google.com/maps/documentation/javascript/reference#MapOptions
  var mapOptions = {
    // How zoomed in you want the map to start at (always required)
    zoom: 11,

    // The latitude and longitude to center the map on (always required)
    center: new google.maps.LatLng(37.2845934, -121.951675), // ZURB HQ

    // How you would like to style the map.
    styles: [{'featureType':'water','stylers':[{'visibility':'on'},{'color':'#acbcc9'}]},{'featureType':'landscape','stylers':[{'color':'#f2e5d4'}]},{'featureType':'road.highway','elementType':'geometry','stylers':[{'color':'#c5c6c6'}]},{'featureType':'road.arterial','elementType':'geometry','stylers':[{'color':'#e4d7c6'}]},{'featureType':'road.local','elementType':'geometry','stylers':[{'color':'#fbfaf7'}]},{'featureType':'poi.park','elementType':'geometry','stylers':[{'color':'#c5dac6'}]},{'featureType':'administrative','stylers':[{'visibility':'on'},{'lightness':33}]},{'featureType':'road'},{'featureType':'poi.park','elementType':'labels','stylers':[{'visibility':'on'},{'lightness':20}]},{},{'featureType':'road','stylers':[{'lightness':20}]}]
  };

  // Get the HTML DOM element that will contain the map
  var mapElement = document.getElementById('map');

  // Create the Google Map using the element and options defined above
  var map = new google.maps.Map(mapElement, mapOptions);
  var markerOptions = {
    map: map,
    position: {lat: 37.2845934, lng: -121.951675},
    title: 'ZURB HQ'
  };
  new google.maps.Marker(markerOptions);
};

}();
