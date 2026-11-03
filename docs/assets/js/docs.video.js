// Component-page intro video: YouTube iframe API integration, dock-on-
// scroll, deep links (?video= / [data-open-video] with timestamps).
// 7.0 chrome re-skin (unit 3): jQuery-free port — the YT API usage is
// untouched, the DOM layer is native.

!function() {

// Parse the query string once (?video=<id> deep links)
var QueryString = function() {
  var query_string = {};
  var query = window.location.search.substring(1);
  var vars = query.split('&');
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split('=');
    if (typeof query_string[pair[0]] === 'undefined') {
      query_string[pair[0]] = decodeURIComponent(pair[1]);
    } else if (typeof query_string[pair[0]] === 'string') {
      query_string[pair[0]] = [query_string[pair[0]], decodeURIComponent(pair[1])];
    } else {
      query_string[pair[0]].push(decodeURIComponent(pair[1]));
    }
  }
  return query_string;
}();

var mainVideo = document.getElementById('main-video');

if (mainVideo) {
  var videoOuter = document.getElementById('subpage-intro-video');
  var videoInner = videoOuter.querySelector('.docs-video-inner');
  var videoOverlay = videoOuter.querySelector('.video-overlay');
  var videoId = mainVideo.dataset.video;

  // Load the IFrame Player API code asynchronously
  var tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  var firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  var mainPlayer, embeddedPlayers = [];

  // Called by the YT API once it has downloaded
  window.onYouTubeIframeAPIReady = function() {
    mainPlayer = new YT.Player('main-video', {
      height: '385',
      width: '690',
      videoId: videoId,
      playerVars: { showinfo: '0' },
      events: {
        'onReady': onPlayerReady,
        'onStateChange': onPlayerStateChange
      }
    });

    document.querySelectorAll('[data-linkable-video]').forEach(function(vid) {
      var id = vid.id;
      var linkableId = vid.dataset.linkableVideo;
      embeddedPlayers.push({
        id: id,
        video: linkableId,
        player: new YT.Player(id, {
          events: {
            'onReady': onPlayerReady
          }
        })
      });
    });
  };

  var offsetTop = function(el) {
    return el.getBoundingClientRect().top + window.pageYOffset;
  };

  var onPlayerReady = function() {
    if (QueryString.video == videoId) {
      mainPlayer.playVideo();
    } else if (QueryString.video) {
      for (var i = 0; i < embeddedPlayers.length; i++) {
        if (QueryString.video == embeddedPlayers[i].video) {
          window.scrollTo(0, offsetTop(document.getElementById(embeddedPlayers[i].id)) - 200);

          // Don't show the main vid if we're autoplaying a different one.
          videoInner.classList.remove('autostick', 'expanded');
          videoOverlay.classList.remove('expanded');
          embeddedPlayers[i].player.playVideo();
        }
      }
    }
  };

  var onPlayerStateChange = function(event) {
    if (event.data == YT.PlayerState.PLAYING) {
      videoInner.classList.add('playing', 'autostick');
    } else {
      videoInner.classList.remove('playing');
    }
  };

  window.addEventListener('scroll', function() {
    var videoOffset = offsetTop(videoOuter);
    var videoHeight = videoOuter.offsetHeight;
    var myScrollPosition = window.pageYOffset;

    if (myScrollPosition > (videoOffset + videoHeight - 300)) {
      videoInner.classList.add('is-stuck');
      videoOverlay.classList.add('is-stuck');
    } else {
      videoInner.classList.remove('is-stuck');
      videoOverlay.classList.remove('is-stuck');
    }
  }, { passive: true });

  document.querySelectorAll('[data-close-video]').forEach(function(el) {
    el.addEventListener('click', function() {
      mainPlayer.stopVideo();
      videoInner.classList.remove('autostick', 'expanded');
      videoOverlay.classList.remove('expanded');
    });
  });

  document.querySelectorAll('[data-expand-contract-video]').forEach(function(el) {
    el.addEventListener('click', function() {
      videoInner.classList.toggle('expanded');
      videoOverlay.classList.toggle('expanded');
    });
  });

  var getSeconds = function(link) {
    var time = link.dataset.openVideo;
    var sections = String(time).split(':');
    var seconds;
    if (sections.length > 1) {
      seconds = (60 * Number(sections[0])) + Number(sections[1]);
    } else {
      seconds = Number(sections[0]);
    }
    return seconds;
  };

  var mobileLink = document.getElementById('docs-mobile-video-link');
  var mobileHref = mobileLink ? mobileLink.getAttribute('href') : '';

  document.querySelectorAll('[data-open-video]').forEach(function(el) {
    var seconds = getSeconds(el);
    el.href = mobileHref + '&t=' + seconds;
    el.target = '_blank';

    el.addEventListener('click', function(e) {
      if (Foundation.MediaQuery.is('small only')) {
        return;
      }
      e.preventDefault();
      var seconds = getSeconds(el);
      mainPlayer.seekTo(seconds, true);
      mainPlayer.playVideo();
      videoOverlay.classList.add('expanded');
      videoInner.classList.add('expanded', 'autostick');
    });
  });
}

}();
