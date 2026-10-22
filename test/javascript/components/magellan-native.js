// S7 contract pins (7.0 line A): Magellan's event plumbing moved to the
// native Events layer - the resizeme/scrollme consumers (the Triggers
// producers have dispatched real events since S4), the delegated link
// clicks and the deep-link hashchange (under the per-instance namespace
// shape introduced for Reveal) - while the public contract stays
// byte-identical. These tests pin that contract from the outside; the
// pre-existing magellan.js suite is untouched on purpose and stays green.
describe('Magellan (native layer contract)', function() {
  var plugin;
  var $html, $content;

  afterEach(function() {
    if (plugin) {
      plugin.destroy();
      plugin = null;
    }
    if ($html) { $html.remove(); $html = null; }
    if ($content) { $content.remove(); $content = null; }
    window.scrollTo(0, 0);
    if (window.location.hash) {
      window.history.replaceState('', document.title, window.location.pathname + window.location.search);
    }
  });

  function buildUl(count, prefix) {
    var html = '<ul id="' + prefix + '-nav" class="vertical-menu">';
    for (var c = 0; c < count; c++) {
      html += '<li><a href="#' + prefix + '-t' + c + '">Section ' + c + '</a></li>';
    }
    html += '</ul>';
    return html;
  }

  function buildContent(count, prefix) {
    var html = '<div>';
    for (var c = 0; c < count; c++) {
      html += '<div id="' + prefix + '-t' + c + '" data-magellan-target="' + prefix + '-t' + c + '" style="height: 1000px">Section ' + c + '</div>';
    }
    html += '</div>';
    return html;
  }

  function absoluteTop(el) {
    return Math.round(el.getBoundingClientRect().top + window.pageYOffset);
  }

  function buildPlugin(prefix, options) {
    $html = $(buildUl(3, prefix)).appendTo('body');
    $content = $(buildContent(3, prefix)).appendTo('body');
    plugin = new Foundation.Magellan($html, options);
    return plugin;
  }

  describe('deep link', function() {
    it('scrolls to the hash target through a real hashchange on the native event layer', function(done) {
      buildPlugin('mg1', {deepLinking: true, animationDuration: 0, threshold: 0, offset: 0});

      // write the hash without a browser navigation, then dispatch the real
      // event - only the plugin's native listener can react to this
      window.history.replaceState('', document.title, '#mg1-t1');
      var expected = absoluteTop(document.getElementById('mg1-t1'));

      window.dispatchEvent(new Event('hashchange'));

      tryInterval({
        interval: 10,
        timeout: 2000,
        try: () => { window.pageYOffset.should.equal(expected); },
        then: done
      });
    });

    it('stops following the hash after destroy', function(done) {
      buildPlugin('mg2', {deepLinking: true, animationDuration: 0, threshold: 0, offset: 0});

      setTimeout(function() {
        window.history.replaceState('', document.title, '#mg2-t1');
        plugin.destroy();
        plugin = null;
        var before = window.pageYOffset;

        window.dispatchEvent(new Event('hashchange'));

        setTimeout(function() {
          window.pageYOffset.should.equal(before);
          done();
        }, 100);
      }, 50);
    });
  });

  describe('active switching', function() {
    it('moves the active class through scrollme.zf.trigger on the native event layer and fires update.zf.magellan', function(done) {
      buildPlugin('mg3', {animationDuration: 0, threshold: 50, offset: 0});
      var el = $html[0];
      var links = el.querySelectorAll('a');
      var updateSpy = sinon.spy();
      FoundationNext.Events.on(el, 'update.zf.magellan', updateSpy);

      // ~100px past the second target's demarcation line: link 1 activates
      window.scrollTo(0, absoluteTop(document.getElementById('mg3-t1')) + 100);
      FoundationNext.Events.trigger(el, 'scrollme.zf.trigger');

      tryInterval({
        interval: 10,
        timeout: 2000,
        try: () => {
          links[1].classList.contains('is-active').should.be.true;
          links[0].classList.contains('is-active').should.be.false;
          updateSpy.callCount.should.equal(1);
        },
        then: () => {
          updateSpy.firstCall.args[0].type.should.equal('update');
          updateSpy.firstCall.args[0].namespace.should.equal('magellan.zf');
          // the forwarded $active collection rides as the event parameter
          // (its final native-element form is the wrap-up slice's uniform move)
          updateSpy.firstCall.args[1][0].should.equal(links[1]);

          // back up towards the first target: link 0 takes over
          window.scrollTo(0, absoluteTop(document.getElementById('mg3-t0')) + 100);
          FoundationNext.Events.trigger(el, 'scrollme.zf.trigger');
          tryInterval({
            interval: 10,
            timeout: 2000,
            try: () => {
              links[0].classList.contains('is-active').should.be.true;
              links[1].classList.contains('is-active').should.be.false;
              updateSpy.callCount.should.equal(2);
            },
            then: done
          });
        }
      });
    });

    it('receives scrollme.zf.trigger from the real Triggers broadcast (S4 producer, S7 consumer)', function(done) {
      buildPlugin('mg4', {animationDuration: 0});
      var links = $html[0].querySelectorAll('a');

      window.scrollTo(0, absoluteTop(document.getElementById('mg4-t1')) + 100);
      Foundation.Triggers.Initializers.addScrollListener(10);

      tryInterval({
        interval: 20,
        timeout: 2000,
        try: () => { links[1].classList.contains('is-active').should.be.true; },
        then: done
      });
    });

    it('recalculates the points through resizeme.zf.trigger on the native event layer', function(done) {
      buildPlugin('mg5', {animationDuration: 0});
      var el = $html[0];

      // the resizeme listener installs in the onLoad callback: give it a beat
      setTimeout(function() {
        var before = plugin.points.slice();

        // resizing a target moves the demarcation lines after it; the reflow
        // re-measures the captured target collection (new targets arriving
        // after init are not picked up - the 6.x limitation)
        document.getElementById('mg5-t1').style.height = '2500px';
        var expectedSecond = Math.round(absoluteTop(document.getElementById('mg5-t2')) - 50);

        FoundationNext.Events.trigger(el, 'resizeme.zf.trigger');
        plugin.points.length.should.equal(before.length);
        plugin.points[2].should.equal(expectedSecond);
        done();
      }, 50);
    });

    it('removes the active class from the links on destroy', function(done) {
      buildPlugin('mg6', {animationDuration: 0});
      var el = $html[0];
      var links = el.querySelectorAll('a');

      window.scrollTo(0, absoluteTop(document.getElementById('mg6-t1')) + 100);
      FoundationNext.Events.trigger(el, 'scrollme.zf.trigger');

      tryInterval({
        interval: 10,
        timeout: 2000,
        try: () => { links[1].classList.contains('is-active').should.be.true; },
        then: () => {
          plugin.destroy();
          plugin = null;
          links[1].classList.contains('is-active').should.be.false;
          done();
        }
      });
    });
  });

  describe('link clicks', function() {
    it('scrolls on a real click of a contained link and prevents the hash jump', function(done) {
      buildPlugin('mg7', {animationDuration: 50, threshold: 0, offset: 30});
      var link = $html.find('a')[1];

      // the click listeners install in the onLoad callback: give it a beat
      setTimeout(function() {
        var click = new MouseEvent('click', {bubbles: true, cancelable: true});
        link.dispatchEvent(click);
        click.defaultPrevented.should.be.true;

        // SmoothScroll lands offset pixels above the raw anchor position
        // (a plain browser hash jump would land exactly on it)
        var expected = absoluteTop(document.getElementById('mg7-t1')) - 30;
        tryInterval({
          interval: 10,
          timeout: 2000,
          try: () => { window.pageYOffset.should.equal(expected); },
          then: done
        });
      }, 50);
    });
  });
});
