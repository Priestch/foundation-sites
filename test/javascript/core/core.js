describe('Foundation core', function() {
  it('exists on the window', function() {
    (window.Foundation).should.be.an('object');
  });

  it('exposes Foundation.init as the 7.0 initialization entry (plan B)', function() {
    (Foundation.init).should.to.be.a('function');
    // the jQuery prototype function is gone with addToJquery
    chai.expect($.fn.foundation).to.be.undefined;
  });

  describe('init()', function() {
    var added;
    beforeEach(function() { added = []; });
    afterEach(function() { added.forEach(function(el) { el.remove(); }); });

    it('initializes plugins under a root, primes MediaQuery and drops .no-js', function() {
      var noJs = document.body.appendChild(document.createElement('div'));
      noJs.className = 'no-js';

      var el = document.body.appendChild(document.createElement('div'));
      el.setAttribute('data-toggler', 'probe-init-class');
      added.push(el, noJs);

      var root = document.body.appendChild(document.createElement('div'));
      root.appendChild(el);
      added.push(root);

      Foundation.init(root);

      // the plugin under the root was constructed and registered
      chai.expect(Foundation.Registry.getInstance(el)).to.exist;
      // the no-js class was dropped (document-wide, like 6.x)
      noJs.classList.contains('no-js').should.be.false;
      // MediaQuery is primed
      (typeof Foundation.MediaQuery.current).should.be.a('string');

      Foundation.Registry.getInstance(el).destroy();
    });

    it('defaults to the whole document', function() {
      var el = document.body.appendChild(document.createElement('div'));
      el.setAttribute('data-toggler', 'probe-init-doc');
      added.push(el);

      Foundation.init();

      chai.expect(Foundation.Registry.getInstance(el)).to.exist;
      Foundation.Registry.getInstance(el).destroy();
    });
  });

  describe('plugin()', function() {
    afterEach(function() {
      delete Foundation._plugins.plugin;
      delete Foundation.Plugin;
    });

    it('adds Foundation plugins', function() {
      function Plugin() {}
      Foundation.plugin(Plugin, 'Plugin');

      (Foundation._plugins.plugin).should.be.a('function');
      (Foundation.Plugin).should.be.a('function');
    });

    it('uses the name of the Plugin class/function if one is not provided', function() {
      function Plugin() {}
      Foundation.plugin(Plugin);

      (Foundation._plugins.plugin).should.be.a('function');
      (Foundation.Plugin).should.be.a('function');
    });
  });

  describe('registerPlugin()', function() {
    var Probe, $el, initSpy;

    // Minimal plugin double: registerPlugin only needs `$element`, a
    // constructor name, and a method reachable through the $(el).foundation()
    // dispatch, which is how the instance store is observed since S2 moved
    // it into the Registry.
    Probe = class Probe {
      constructor(element, options) {
        this.$element = element;
        this.options = options || {};
      }
      probeMethod() {}
    };

    beforeEach(function() {
      $el = $('<div id="probe-el"></div>').appendTo('body');
      initSpy = sinon.spy();
      $el.on('init.zf.probe', initSpy);
    });

    afterEach(function() {
      $el.off('init.zf.probe');
      $el.removeAttr('data-probe');
      $el.remove();
    });

    it('registers a new instance of a plugin', function() {
      var instance = new Probe($el, {});

      Foundation.registerPlugin(instance);

      (instance.uuid).should.be.a('string');
      // 7.0: the method-dispatch surface ($.fn.foundation) is gone; the
      // Registry is the lookup
      Foundation.Registry.getInstance($el[0]).should.equal(instance);
      ($el.attr('data-probe')).should.equal(instance.uuid);
    });

    it('pushes the instance uuid onto Foundation._uuids', function() {
      var instance = new Probe($el, {});

      Foundation.registerPlugin(instance);

      (Foundation._uuids).should.contain(instance.uuid);
    });

    it('fires init.zf.<pluginName> on the element', function() {
      var instance = new Probe($el, {});

      Foundation.registerPlugin(instance);

      sinon.assert.calledOnce(initSpy);
    });

    it('does not overwrite an existing data-<pluginName> attribute', function() {
      var instance = new Probe($el, {});

      $el.attr('data-probe', 'preset');
      Foundation.registerPlugin(instance);

      ($el.attr('data-probe')).should.equal('preset');
    });
  });

  describe('unregisterPlugin()', function() {
    var Probe, $el, instance, destroyedSpy;

    Probe = class Probe {
      constructor(element, options) {
        this.$element = element;
        this.options = options || {};
      }
      probeMethod() {}
    };

    beforeEach(function() {
      $el = $('<div id="probe-el"></div>').appendTo('body');
      instance = new Probe($el, {});
      Foundation.registerPlugin(instance);
      destroyedSpy = sinon.spy();
      $el.on('destroyed.zf.probe', destroyedSpy);
    });

    afterEach(function() {
      $el.off('destroyed.zf.probe');
      $el.removeAttr('data-probe');
      $el.remove();
    });

    it('un-registers a plugin being destroyed', function() {
      Foundation.unregisterPlugin(instance);

      chai.expect($el.attr('data-probe')).to.not.exist;
      chai.expect(Foundation.Registry.getInstance($el[0])).to.be.undefined;
    });

    it('removes the instance uuid from Foundation._uuids', function() {
      Foundation.unregisterPlugin(instance);

      (Foundation._uuids).should.not.contain(instance.uuid);
    });

    it('fires destroyed.zf.<pluginName> on the element', function() {
      Foundation.unregisterPlugin(instance);

      sinon.assert.calledOnce(destroyedSpy);
    });

    it('removes only the destroyed instance (round trip)', function() {
      var $other = $('<div id="probe-el-other"></div>').appendTo('body');
      var other = new Probe($other, {});
      Foundation.registerPlugin(other);

      Foundation.unregisterPlugin(instance);

      Foundation.Registry.getInstance($other[0]).should.equal(other);
      chai.expect(Foundation.Registry.getInstance($el[0])).to.be.undefined;
      $other.removeAttr('data-probe');
      $other.remove();
    });
  });

  describe('reInit()', function() {
    var Probe, $el, instance;

    Probe = class Probe {
      constructor(element, options) {
        this.$element = element;
        this.options = options || {};
        this.initCount = 0;
        this._init();
      }

      _init() {
        this.initCount++;
      }
    };

    beforeEach(function() {
      Foundation.plugin(Probe, 'Probe');
      $el = $('<div id="probe-el" data-probe></div>').appendTo('body');
      instance = new Probe($el, {});
      // S2: instances seed through the public registerPlugin path now that
      // the store is the Registry instead of jQuery data.
      Foundation.registerPlugin(instance, 'Probe');
    });

    afterEach(function() {
      delete Foundation._plugins['probe'];
      delete Foundation.Probe;
      $el.remove();
    });

    it('re-runs _init() of the plugin on a plugin name string', function() {
      (instance.initCount).should.equal(1);

      Foundation.reInit('Probe');

      (instance.initCount).should.equal(2);
    });

    it('re-runs _init() of the plugins on a jQuery collection', function() {
      (instance.initCount).should.equal(1);

      Foundation.reInit($el);

      (instance.initCount).should.equal(2);
    });

    it('re-runs _init() of the plugin on a native element', function() {
      (instance.initCount).should.equal(1);

      Foundation.reInit($el[0]);

      (instance.initCount).should.equal(2);
    });

    it('rebuilds every matching instance, not only the first', function() {
      var $second = $('<div id="probe-el-second" data-probe></div>').appendTo('body');
      var second = new Probe($second, {});
      Foundation.registerPlugin(second, 'Probe');

      Foundation.reInit('Probe');

      (instance.initCount).should.equal(2);
      (second.initCount).should.equal(2);
      $second.remove();
    });
  });

  describe('reflow()', function() {
    var Probe, constructed, instances;

    Probe = class Probe {
      constructor(element, options) {
        this.$element = element;
        this.options = options;
        constructed++;
        instances.push(this);
      }
    };

    beforeEach(function() {
      Foundation.plugin(Probe, 'Probe');
      constructed = 0;
      instances = [];
    });

    afterEach(function() {
      delete Foundation._plugins['probe'];
      delete Foundation.Probe;
      $('[data-probe]').remove();
    });

    it('initializes every matching element that has no instance yet', function() {
      var $a = $('<div id="probe-el-a" data-probe></div>').appendTo('body');
      var $b = $('<div id="probe-el-b" data-probe></div>').appendTo('body');

      Foundation.reflow(document.body, 'probe');

      constructed.should.equal(2);
      instances[0].$element.should.equal($a[0]);
      instances[1].$element.should.equal($b[0]);
    });

    it('does not re-initialize elements that already carry an instance', function() {
      var $a = $('<div id="probe-el-a" data-probe></div>').appendTo('body');

      // First pass in the legacy jQuery-root form, second native: both must
      // see the registered instance.
      Foundation.reflow($('body'), 'probe');
      constructed.should.equal(1);

      Foundation.reflow(document.body, 'probe');
      constructed.should.equal(1);
    });

    it('parses data-options and adds the reflow flag', function() {
      var $a = $('<div id="probe-el-a" data-probe data-options="foo: 2; bar: true"></div>').appendTo('body');

      Foundation.reflow($('body'), 'probe');

      (instances[0].$element).should.equal($a[0]);
      (instances[0].options.reflow).should.be.true;
      (instances[0].options.foo).should.equal(2);
      (instances[0].options.bar).should.be.true;
    });

    it('only scans inside the given element', function() {
      var $container = $('<div id="probe-el-container-a"></div>').appendTo('body');
      $('<div id="probe-el-inside" data-probe></div>').appendTo($container);
      $('<div id="probe-el-outside" data-probe></div>').appendTo('body');

      Foundation.reflow($container[0], 'probe');

      constructed.should.equal(1);
      (instances[0].$element.id).should.equal('probe-el-inside');
      $container.remove();
    });

    it('accepts a selector string as the search root', function() {
      var $container = $('<div id="probe-el-container-b"></div>').appendTo('body');
      $('<div id="probe-el-inside-b" data-probe></div>').appendTo($container);
      $('<div id="probe-el-outside-b" data-probe></div>').appendTo('body');

      Foundation.reflow('#probe-el-container-b', 'probe');

      constructed.should.equal(1);
      (instances[0].$element.id).should.equal('probe-el-inside-b');
      $container.remove();
    });
  });

  // The obligation events keep firing through the jQuery trigger channel in
  // the mixed state (ruling 2026-10-22): call sites, parameters and timing
  // are unchanged by the S2 storage swap. These cases pin the observable
  // behavior so the later native-Events switch cannot drift silently.
  describe('init/destroyed event channel regression', function() {
    var Probe, $container, $el;

    Probe = class Probe {
      constructor(element) {
        this.$element = element;
      }
    };

    beforeEach(function() {
      $container = $('<div id="channel-container"></div>').appendTo('body');
      $el = $('<div id="channel-el"></div>').appendTo($container);
    });

    afterEach(function() {
      $el.removeAttr('data-probe');
      $container.remove();
    });

    it('fires init.zf.<name> as a real event the jQuery listener absorbs (white absorption)', function() {
      var spy = sinon.spy();

      $el.on('init.zf.probe', spy);
      Foundation.registerPlugin(new Probe($el), 'Probe');
      $el.off('init.zf.probe');

      sinon.assert.calledOnce(spy);
      // 7.0 terminal form: registerPlugin dispatches a real bubbling event;
      // the jQuery listener hears it through white absorption with the bare
      // type and NO jQuery namespace (like every real event).
      spy.firstCall.args[0].type.should.equal('init');
      chai.expect(spy.firstCall.args[0].namespace).to.be.undefined;
    });

    it('fires init.zf.<name> only after the data-<name> attribute is written', function() {
      var seenAttr = 'unset';

      $el.on('init.zf.probe', function() {
        seenAttr = $el.attr('data-probe');
      });
      Foundation.registerPlugin(new Probe($el), 'Probe');
      $el.off('init.zf.probe');

      (typeof seenAttr).should.equal('string');
      seenAttr.length.should.be.above(0);
    });

    it('bubbles init.zf.<name> to ancestors', function() {
      var spy = sinon.spy();

      $container.on('init.zf.probe', spy);
      Foundation.registerPlugin(new Probe($el), 'Probe');
      $container.off('init.zf.probe');

      sinon.assert.calledOnce(spy);
    });

    it('passes no extra parameters with init.zf.<name>', function() {
      var spy = sinon.spy();

      $el.on('init.zf.probe', spy);
      Foundation.registerPlugin(new Probe($el), 'Probe');
      $el.off('init.zf.probe');

      spy.firstCall.args.length.should.equal(1);
    });

    it('fires destroyed.zf.<name> after the data-<name> attribute is removed', function() {
      var instance = new Probe($el);
      var spy = sinon.spy();
      var seenAttr = 'unset';

      Foundation.registerPlugin(instance, 'Probe');
      $el.on('destroyed.zf.probe', function() {
        spy();
        seenAttr = $el.attr('data-probe');
      });
      Foundation.unregisterPlugin(instance);
      $el.off('destroyed.zf.probe');

      sinon.assert.calledOnce(spy);
      // null hides .should from chai (no property access on null).
      chai.expect(seenAttr).to.not.exist;
    });
  });

  describe('getFnName()', function() {
    it('should handle a function declaration', function() {
      function A() {};
      var name = Foundation.getFnName(A);

      name.should.be.a('string');
      name.should.be.equal('A');
    });

    it('should handle an anonymous function expression', function() {
      var name = Foundation.getFnName(function(){});

      // Inferred names (i.e. `var name = function() {}`) are not tested as they are widely supported
      // See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/name#Inferred_function_names
      name.should.be.a('string');
      name.should.be.equal('');
    });

    it('should handle a named function expression', function() {
      var D = function foo(){};
      var name = Foundation.getFnName(D);

      name.should.be.a('string');
      name.should.be.equal('foo');
    });
  });

  describe('transitionEnd()', function() {
  });

  describe('onLoad()', function (done) {
  });

  describe('throttle()', function() {
  });
});
