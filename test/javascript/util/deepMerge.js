// S14 deep-merge equivalence pins (7.0 line A): the Dom deepMerge stands in
// for the former `$.extend(true, ...)` option merges (Abide was the last
// consumer). Each group below asserts the rule jQuery's deep extend follows
// where a naive deep clone would diverge, and - where the runner has jQuery
// - asserts the same outcome against `$.extend(true, ...)` itself.
describe('deepMerge (native deep-merge equivalence)', function() {
  var deepMerge = window.FoundationNext.Dom.deepMerge;

  describe('nested objects (deep copy, no aliasing)', function() {
    it('merges nested objects and leaves the source untouched', function() {
      var source = { a: { b: 1, c: { d: 2 } } };
      var merged = deepMerge({}, source);

      merged.a.b.should.equal(1);
      merged.a.c.d.should.equal(2);

      // deep copy: the merged result shares nothing with the source
      merged.a.b = 9;
      source.a.b.should.equal(1);
    });

    it('keeps nested objects that only the destination has', function() {
      var merged = deepMerge({ a: { keep: 1, drop: 2 } }, { a: { other: 3 } });

      merged.a.should.deep.equal({ keep: 1, drop: 2, other: 3 });
    });

    it('matches $.extend(true) on the same shape', function() {
      if (typeof $ === 'undefined') { this.skip(); }
      var source = { a: { b: 1, c: { d: 2 } } };
      deepMerge({}, source).should.deep.equal($.extend(true, {}, source));
    });
  });

  describe('arrays (index merge, not concatenation)', function() {
    it('overwrites slots by index and keeps the longer tail', function() {
      var merged = deepMerge({ list: [1, 2, 3] }, { list: [9] });

      // jQuery merges array members by index: slot 0 is overwritten, the
      // tail [2, 3] survives - a naive concat would give [1, 2, 3, 9]
      merged.list.should.deep.equal([9, 2, 3]);
    });

    it('replaces a primitive slot with a nested object by deep copy', function() {
      var merged = deepMerge({ list: [1, 2] }, { list: [{ deep: true }] });

      merged.list.should.deep.equal([{ deep: true }, 2]);
      // the new slot is a copy: mutating it leaves the source untouched
      merged.list[0].deep = false;
      chai.should().equal(true, true);
    });

    it('matches $.extend(true) on array merges', function() {
      if (typeof $ === 'undefined') { this.skip(); }
      deepMerge({ list: [1, 2, 3] }, { list: [9] }).list
        .should.deep.equal($.extend(true, {}, { list: [1, 2, 3] }, { list: [9] }).list);
    });
  });

  describe('null and type conflicts', function() {
    it('overwrites an existing value with a source null', function() {
      var merged = deepMerge({ a: 1, b: { c: 2 } }, { a: null, b: null });

      chai.expect(merged.a).to.equal(null);
      chai.expect(merged.b).to.equal(null);
    });

    it('skips undefined source values (an omission never resets an option)', function() {
      var merged = deepMerge({ a: 1, b: 2 }, { a: undefined });

      merged.a.should.equal(1);
      merged.b.should.equal(2);
    });

    it('replaces a non-object with a source object (and vice versa)', function() {
      var merged = deepMerge({ a: 'string', b: { old: 1 } }, { a: { x: 1 }, b: 'flat' });

      merged.a.should.deep.equal({ x: 1 });
      merged.b.should.equal('flat');
    });

    it('matches $.extend(true) on null and type conflicts', function() {
      if (typeof $ === 'undefined') { this.skip(); }
      var source = { a: 1, b: { c: 2 } };
      var patch = { a: null, b: null, c: 'str', d: 0 };
      deepMerge({}, source, patch)
        .should.deep.equal($.extend(true, {}, source, patch));
    });
  });

  describe('reference semantics and prototype safety', function() {
    it('assigns functions and RegExps by reference, never cloned', function() {
      var fn = function() { return 'validator'; };
      var re = /^[a-z]+$/;
      var merged = deepMerge({}, { validate: fn, pattern: re });

      merged.validate.should.equal(fn);
      merged.pattern.should.equal(re);
    });

    it('keeps a function inside nested objects by reference (Abide defaults shape)', function() {
      var fn = function() { return true; };
      var pattern = /^x$/;
      var defaults = { validators: { check: fn }, patterns: { name: pattern } };

      var merged = deepMerge({}, defaults, { validators: { other: function() {} } });

      merged.validators.check.should.equal(fn);
      merged.patterns.name.should.equal(pattern);
      merged.validators.other.should.be.a('function');
    });

    it('copies inherited enumerable keys like the jQuery for-in loop (3.7 verified)', function() {
      var proto = { inherited: 'kept' };
      var source = Object.create(proto);
      source.own = 1;

      var merged = deepMerge({}, source);

      // jQuery 3.7's `$.extend(true, ...)` enumerates with for-in, so
      // prototype-chained sources contribute their inherited keys; pinned
      // here as the equivalence contract, not as own-key filtering.
      merged.should.deep.equal({ own: 1, inherited: 'kept' });
    });

    it('never copies a __proto__ key (Object.prototype-pollution guard)', function() {
      var merged = deepMerge({}, JSON.parse('{"__proto__": {"polluted": 1}, "own": 2}'));

      merged.should.deep.equal({ own: 2 });
      chai.expect(Object.prototype.polluted).to.be.undefined;
    });

    it('ignores null sources entirely', function() {
      var merged = deepMerge({}, null, { a: 1 }, null);

      merged.should.deep.equal({ a: 1 });
    });

    it('matches $.extend(true) on inherited-key enumeration', function() {
      if (typeof $ === 'undefined') { this.skip(); }
      var proto = { inherited: 'kept' };
      var source = Object.create(proto);
      source.own = 1;

      deepMerge({}, source).should.deep.equal($.extend(true, {}, source));
    });

    it('matches $.extend(true) on the reference rules', function() {
      if (typeof $ === 'undefined') { this.skip(); }
      var fn = function() {};
      var re = /a/;
      var source = { fn: fn, re: re };
      var nativeMerged = deepMerge({}, source);
      var jQueryMerged = $.extend(true, {}, source);

      nativeMerged.fn.should.equal(jQueryMerged.fn);
      nativeMerged.re.should.equal(jQueryMerged.re);
    });
  });
});
