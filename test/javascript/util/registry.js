describe('FoundationNext.Registry', function() {
  var el, other;

  beforeEach(function() {
    el = document.createElement('div');
    other = document.createElement('span');
  });

  afterEach(function() {
    FoundationNext.Registry.removeInstance(el);
    FoundationNext.Registry.removeInstance(other);
  });

  describe('getInstance()', function() {
    it('returns undefined for an element without an instance', function() {
      chai.expect(FoundationNext.Registry.getInstance(el)).to.not.exist;
    });
  });

  describe('setInstance()', function() {
    it('stores an instance retrievable by point lookup', function() {
      var instance = { name: 'toggler' };

      FoundationNext.Registry.setInstance(el, instance);

      (FoundationNext.Registry.getInstance(el)).should.equal(instance);
    });

    it('overwrites a previous instance on the same element', function() {
      var first = { name: 'first' };
      var second = { name: 'second' };

      FoundationNext.Registry.setInstance(el, first);
      FoundationNext.Registry.setInstance(el, second);

      (FoundationNext.Registry.getInstance(el)).should.equal(second);
    });

    it('keys entries per element', function() {
      var instance = { name: 'toggler' };

      FoundationNext.Registry.setInstance(el, instance);

      (FoundationNext.Registry.getInstance(el)).should.equal(instance);
      chai.expect(FoundationNext.Registry.getInstance(other)).to.not.exist;
    });
  });

  describe('has()', function() {
    it('is false before and true after a set', function() {
      (FoundationNext.Registry.has(el)).should.be.false;

      FoundationNext.Registry.setInstance(el, { name: 'toggler' });

      (FoundationNext.Registry.has(el)).should.be.true;
    });

    it('is false again after removeInstance()', function() {
      FoundationNext.Registry.setInstance(el, { name: 'toggler' });
      FoundationNext.Registry.removeInstance(el);

      (FoundationNext.Registry.has(el)).should.be.false;
    });
  });

  describe('removeInstance()', function() {
    it('removes the entry and reports whether one existed', function() {
      FoundationNext.Registry.setInstance(el, { name: 'toggler' });

      (FoundationNext.Registry.removeInstance(el)).should.be.true;
      (FoundationNext.Registry.removeInstance(el)).should.be.false;
      chai.expect(FoundationNext.Registry.getInstance(el)).to.not.exist;
    });
  });

  // The table is a WeakMap: entries are keyed weakly and removed via the
  // destroy path, so a destroyed-and-unreferenced element does not stay alive
  // through the registry. Actual collection cannot be asserted deterministically
  // here; these pin the observable weak-key API contract instead.
  describe('weak-key contract', function() {
    it('accepts detached elements and clears them like attached ones', function() {
      var detached = document.createElement('div');

      FoundationNext.Registry.setInstance(detached, { name: 'detached' });
      (FoundationNext.Registry.has(detached)).should.be.true;

      FoundationNext.Registry.removeInstance(detached);
      (FoundationNext.Registry.has(detached)).should.be.false;
    });
  });
});
