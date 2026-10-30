// S12/S14 contract pins (7.0 line A): Interchange's resizeme consumer, the
// replaced.zf.interchange production, the state attribute writes and the
// rule matching moved to the native Events/DOM layer while the public
// contract stays byte-identical; the html-mode partial fetch moved to
// window.fetch with $.get's silent-failure semantics (S14). Both M1 fixes
// are pinned in their kept shape: the one-time load listener per replace and
// the html-mode initialization of the ATTACHED nodes through
// Foundation.reflow. These tests pin that contract from the outside; the
// pre-existing interchange.js suite is untouched on purpose and stays green.
describe('Interchange (native layer contract)', function() {
  var plugin;
  var html;

  afterEach(function() {
    if (plugin) {
      plugin.destroy();
      plugin = null;
    }
    if (html) {
      html.remove();
      html = null;
    }
  });

  function build(attr, options) {
    html = document.body.appendChild(fixture(`<div ${attr || ''}></div>`));
    plugin = new Foundation.Interchange(html, options);
    return plugin;
  }

  // S14: mocks `fetch` for one replace() call, hands the fake response to
  // the plugin's html injection through a microtask and restores fetch even
  // when the assertions fail. The injected-content assertions run on the
  // returned promise, which resolves only after the plugin's own two
  // promise hops (fetch .then + text .then) have both drained.
  function fetchWith(path, response) {    var fetchStub = sinon.stub(window, 'fetch').resolves({
      ok: true,
      text: function() { return Promise.resolve(response); }
    });
    var promise;
    try {
      plugin.replace(path);
      sinon.assert.calledWith(fetchStub, path);
      // hop 1: the plugin's fetch-then callback runs; hop 2: its text-then
      // injection runs; the test's .then appends after both.
      promise = Promise.resolve()
        .then(function() {})
        .then(function() {})
        .then(function() {});
    }
    finally {
      fetchStub.restore();
    }
    return promise;
  }

  describe('init()', function() {
    it('writes the data-resize and id state attributes through the native layer', function() {
      build('data-interchange="[native-interchange.png, (min-width: 99999px)]"');

      var id = html.getAttribute('data-resize');
      (id || '').should.have.length.of.at.least(6);
      html.id.should.equal(id);
    });

    it('matches the rules from the data-interchange attribute on _reflow', function() {
      build('data-interchange="[native-a.png, (min-width: 1px)], [native-b.png, (min-width: 99999px)]"');
      var replaceSpy = sinon.spy(plugin, 'replace');

      plugin._reflow();

      sinon.assert.calledOnce(replaceSpy);
      replaceSpy.firstCall.args[0].should.equal('native-a.png');
    });

    it('resolves special queries through the kept MediaQuery-driven SPECIAL_QUERIES', function() {
      build('data-interchange="[native-a.png, landscape], [native-b.png, retina]"');

      plugin.rules.length.should.equal(2);
      plugin.rules[0].query.should.equal(Foundation.Interchange.SPECIAL_QUERIES['landscape']);
      plugin.rules[1].query.should.equal(Foundation.Interchange.SPECIAL_QUERIES['retina']);
    });

    it('re-reads the data-interchange attribute after the plugin wrote its uuid attribute', function() {
      // Plugin's constructor adds the data-interchange uuid attribute after
      // _setup ran; a late _generateRules call (third-party reInit flows)
      // must still find the rule string, like the former .data() read did.
      build('data-interchange="[native-a.png, (min-width: 1px)]"');

      plugin._generateRules();

      plugin.rules.length.should.equal(1);
      plugin.rules[0].path.should.equal('native-a.png');
    });
  });

  describe('resizeme consumption (native layer)', function() {
    it('reflows through resizeme.zf.trigger fired on the native event layer', function() {
      build('data-interchange="[native-a.png, (min-width: 1px)]"');
      var replaceSpy = sinon.spy(plugin, 'replace');

      FoundationNext.Events.trigger(html, 'resizeme.zf.trigger');

      sinon.assert.calledOnce(replaceSpy);
      replaceSpy.firstCall.args[0].should.equal('native-a.png');
    });

    it('does not consume resizeme.zf.trigger fired on the jQuery side anymore', function() {
      build('data-interchange="[native-a.png, (min-width: 1px)]"');
      var replaceSpy = sinon.spy(plugin, 'replace');

      // jQuery-synthesized dispatch stays the instrument: the flipped
      // consumer cannot hear it (no real event)
      $(html).trigger('resizeme.zf.trigger');

      sinon.assert.notCalled(replaceSpy);
    });
  });

  describe('replaced.zf.interchange production (native layer)', function() {
    it('fires through the native event layer with the zf.interchange namespace and reaches jQuery listeners', function() {
      // type 'src' on a div with a path the browser never loads: no real
      // load event can race the assertions below.
      build('', {type: 'src'});
      var el = html;
      var nativeSpy = sinon.spy();
      var jQuerySpy = sinon.spy();
      FoundationNext.Events.on(el, 'replaced.zf.interchange', nativeSpy);
      FoundationNext.Events.on(html, 'replaced.zf.interchange', jQuerySpy);

      plugin.replace('native-never-loaded.png');

      sinon.assert.calledOnce(nativeSpy);
      nativeSpy.firstCall.args[0].type.should.equal('replaced');
      nativeSpy.firstCall.args[0].namespace.should.equal('interchange.zf');
      sinon.assert.calledOnce(jQuerySpy);
      jQuerySpy.firstCall.args[0].type.should.equal('replaced');
    });

    it('arms a one-time load listener per replace that updates currentPath (kept M1 fix shape)', function() {
      build('', {type: 'src'});

      plugin.replace('native-first.png');
      FoundationNext.Events.trigger(html, 'load');
      plugin.currentPath.should.equal('native-first.png');

      // the next replace re-arms exactly one one-time listener; a second
      // load dispatch leaves the state untouched
      plugin.replace('native-second.png');
      FoundationNext.Events.trigger(html, 'load');
      plugin.currentPath.should.equal('native-second.png');
      FoundationNext.Events.trigger(html, 'load');
      plugin.currentPath.should.equal('native-second.png');
    });
  });

  describe('background mode (native layer)', function() {
    it('writes the escaped url into the inline style and fires replaced', function() {
      build('data-interchange=""', {type: 'background'});
      var nativeSpy = sinon.spy();
      FoundationNext.Events.on(html, 'replaced.zf.interchange', nativeSpy);

      plugin.replace('native/img(1).png');

      html.style.backgroundImage.should.contain('native/img%281%29.png');
      sinon.assert.calledOnce(nativeSpy);
    });
  });

  describe('html mode (kept M1 fix)', function() {
    it('initializes the plugins of the inserted content on the attached nodes', function() {
      build('data-interchange=""', {type: 'html'});
      // A child plugin whose rule never matches: its init alone proves the
      // reflow ran on the attached nodes (a detached `$(response)` copy
      // would never receive the data-resize attribute).
      var response = '<div data-interchange="[native-inner.png, (min-width: 99999px)]"></div>';

      return fetchWith('native-partial.html', response).then(function() {
        // the raw response markup is in place (plus the attributes reflow's
        // init added to the child)
        html.innerHTML.indexOf('<div data-interchange="[native-inner.png, (min-width: 99999px)]"').should.equal(0);
        var child = html.firstElementChild;
        (child.getAttribute('data-resize') !== null).should.be.true;
        plugin.currentPath.should.equal('native-partial.html');
      });
    });

    it('fires replaced.zf.interchange from the fetch text handler', function() {
      build('data-interchange=""', {type: 'html'});
      var nativeSpy = sinon.spy();
      FoundationNext.Events.on(html, 'replaced.zf.interchange', nativeSpy);

      return fetchWith('native-partial-2.html', '<p>content</p>').then(function() {
        sinon.assert.calledOnce(nativeSpy);
      });
    });

    it('fetches the requested partial through window.fetch', function() {
      build('data-interchange=""', {type: 'html'});
      var fetchStub = sinon.stub(window, 'fetch').resolves({
        ok: true,
        text: function() { return Promise.resolve('<p>content</p>'); }
      });

      plugin.replace('native-partial-3.html');

      sinon.assert.calledOnce(fetchStub);
      sinon.assert.calledWith(fetchStub, 'native-partial-3.html');
      fetchStub.restore();
    });

    it('is silent on a non-2xx response ($.get parity: no event, no state change)', function() {
      build('data-interchange=""', {type: 'html'});
      var nativeSpy = sinon.spy();
      FoundationNext.Events.on(html, 'replaced.zf.interchange', nativeSpy);
      // fetch resolves on any status; a 404 carries ok=false, which the
      // plugin filters out exactly where $.get's success filter dropped it
      var fetchStub = sinon.stub(window, 'fetch').resolves({
        ok: false,
        status: 404,
        text: function() { return Promise.resolve('<p>should never land</p>'); }
      });

      plugin.replace('native-missing.html');

      sinon.assert.calledOnce(fetchStub);
      return Promise.resolve().then(function() {
        sinon.assert.notCalled(nativeSpy);
        plugin.currentPath.should.equal('');
        html.innerHTML.should.equal('');
        fetchStub.restore();
      });
    });

    it('is silent on a network failure ($.get parity: no event, no state change)', function() {
      build('data-interchange=""', {type: 'html'});
      var nativeSpy = sinon.spy();
      FoundationNext.Events.on(html, 'replaced.zf.interchange', nativeSpy);
      var fetchStub = sinon.stub(window, 'fetch').rejects(new TypeError('Failed to fetch'));

      plugin.replace('native-unreachable.html');

      sinon.assert.calledOnce(fetchStub);
      return Promise.resolve().then(function() {
        sinon.assert.notCalled(nativeSpy);
        plugin.currentPath.should.equal('');
        fetchStub.restore();
      });
    });
  });

  describe('destroy', function() {
    it('drops the native resizeme listener', function() {
      build('data-interchange="[native-a.png, (min-width: 1px)]"');
      var replaceSpy = sinon.spy(plugin, 'replace');
      plugin.destroy();
      plugin = null;

      FoundationNext.Events.trigger(html, 'resizeme.zf.trigger');

      sinon.assert.notCalled(replaceSpy);
    });
  });
});
