describe('Foundation core', function() {
  it('exists on the window', function() {
    (window.Foundation).should.be.an('object');
  });

  it('is a jQuery prototype function', function() {
    ($.fn.foundation).should.to.be.a('function');
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
    // constructor name, and (via unregisterPlugin) the `zfPlugin` data.
    Probe = class Probe {
      constructor(element, options) {
        this.$element = element;
        this.options = options || {};
      }
    };

    beforeEach(function() {
      $el = $('<div id="probe-el"></div>').appendTo('body');
      initSpy = sinon.spy();
      $el.on('init.zf.probe', initSpy);
    });

    afterEach(function() {
      $el.off('init.zf.probe');
      if ($el.data('zfPlugin')) {
        $el.off('destroyed.zf.probe');
        $el.removeData('zfPlugin').removeAttr('data-probe');
      }
      $el.remove();
    });

    it('registers a new instance of a plugin', function() {
      var instance = new Probe($el, {});

      Foundation.registerPlugin(instance);

      (instance.uuid).should.be.a('string');
      ($el.data('zfPlugin')).should.equal(instance);
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
      $el.removeData('zfPlugin').removeAttr('data-probe');
      $el.remove();
    });

    it('un-registers a plugin being destroyed', function() {
      Foundation.unregisterPlugin(instance);

      chai.expect($el.data('zfPlugin')).to.not.exist;
      chai.expect($el.attr('data-probe')).to.not.exist;
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

      ($other.data('zfPlugin')).should.equal(other);
      chai.expect($el.data('zfPlugin')).to.be.undefined;
      $other.removeData('zfPlugin').removeAttr('data-probe');
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
      $el.data('zfPlugin', instance);
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

    it('rebuilds every matching instance, not only the first', function() {
      var $second = $('<div id="probe-el-second" data-probe></div>').appendTo('body');
      var second = new Probe($second, {});
      $second.data('zfPlugin', second);

      Foundation.reInit('Probe');

      (instance.initCount).should.equal(2);
      (second.initCount).should.equal(2);
      $second.remove();
    });
  });

  describe('reflow()', function() {
    var Probe, constructed;

    Probe = class Probe {
      constructor(element, options) {
        this.$element = element;
        this.options = options;
        constructed++;
      }
    };

    beforeEach(function() {
      Foundation.plugin(Probe, 'Probe');
      constructed = 0;
    });

    afterEach(function() {
      delete Foundation._plugins['probe'];
      delete Foundation.Probe;
      $('[data-probe]').remove();
    });

    it('initializes every matching element that has no instance yet', function() {
      var $a = $('<div id="probe-el-a" data-probe></div>').appendTo('body');
      var $b = $('<div id="probe-el-b" data-probe></div>').appendTo('body');

      Foundation.reflow($('body'), 'probe');

      constructed.should.equal(2);
      ($a.data('zfPlugin')).should.be.an.instanceOf(Probe);
      ($b.data('zfPlugin')).should.be.an.instanceOf(Probe);
    });

    it('does not re-initialize elements that already carry an instance', function() {
      var $a = $('<div id="probe-el-a" data-probe></div>').appendTo('body');

      Foundation.reflow($('body'), 'probe');
      constructed.should.equal(1);

      // A second pass sees the existing zfPlugin data and must not re-init.
      Foundation.reflow($('body'), 'probe');
      constructed.should.equal(1);
    });

    it('parses data-options and adds the reflow flag', function() {
      var $a = $('<div id="probe-el-a" data-probe data-options="foo: 2; bar: true"></div>').appendTo('body');

      Foundation.reflow($('body'), 'probe');

      var instance = $a.data('zfPlugin');
      (instance.options.reflow).should.be.true;
      (instance.options.foo).should.equal(2);
      (instance.options.bar).should.be.true;
    });

    it('only scans inside the given element', function() {
      var $container = $('<div id="probe-el-container"></div>').appendTo('body');
      $('<div id="probe-el-inside" data-probe></div>').appendTo($container);
      $('<div id="probe-el-outside" data-probe></div>').appendTo('body');

      Foundation.reflow($container, 'probe');

      constructed.should.equal(1);
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
