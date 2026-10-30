describe('FoundationNext.Dom', function() {
  var container;

  beforeEach(function() {
    container = document.body.appendChild(fixture('<div id="dom-test-container"></div>'));
  });

  afterEach(function() {
    container.remove();
  });

  describe('q()', function() {
    it('finds the first match inside the context', function() {
      container.insertAdjacentHTML('beforeend', '<span id="dom-q-a"></span><span id="dom-q-b"></span>');

      var found = FoundationNext.Dom.q('span', container);

      found.id.should.equal('dom-q-a');
    });

    it('returns null when nothing matches', function() {
      chai.expect(FoundationNext.Dom.q('span', container)).to.not.exist;
    });

    it('defaults the context to the document', function() {
      document.querySelector('#dom-test-container').insertAdjacentHTML('beforeend', '<span id="dom-q-doc"></span>');

      (FoundationNext.Dom.q('#dom-q-doc')).should.exist;
    });
  });

  // Narrow semantics (7.0 default, PENDING DECISION): hidden only when the
  // element or an ancestor is display:none. The zero-size and detached
  // divergences from jQuery's :visible are intentionally not asserted here —
  // see the differential suite report.
  describe('visible()', function() {
    it('is true for a rendered element', function() {
      var el = container.appendChild(fixture("<div></div>"));

      (FoundationNext.Dom.visible(el)).should.be.true;
    });

    it('is false for an element with display:none', function() {
      var el = container.appendChild(fixture("<div style='display: none;'></div>"));

      (FoundationNext.Dom.visible(el)).should.be.false;
    });

    it('is false when an ancestor is display:none', function() {
      var hidden = container.appendChild(fixture("<div style='display: none;'></div>"));
      var el = hidden.appendChild(fixture("<div></div>"));

      (FoundationNext.Dom.visible(el)).should.be.false;
    });
  });

  // jQuery .data() value conversion (DECIDED 2026-10-22, was PENDING "no
  // coercion" in S1): "true"/"false" → boolean, "null" → null, round-trip
  // numbers → number, everything else stays a string. The differential suite
  // pins the same rule against jQuery itself.
  describe('datasetOptions()', function() {
    it('collects data-* attributes as a camelCased object', function() {
      var el = fixture("<div data-foo-bar='hello' data-simple='world'></div>");

      var options = FoundationNext.Dom.datasetOptions(el);

      options.should.deep.equal({ fooBar: 'hello', simple: 'world' });
    });

    it('converts values like jQuery .data() does', function() {
      var el = fixture("<div data-flag='true' data-off='false' data-none='null' data-num='42' data-empty data-text='hello'></div>");

      var options = FoundationNext.Dom.datasetOptions(el);

      options.flag.should.equal(true);
      options.off.should.equal(false);
      // null hides .should from chai (no property access on null).
      chai.expect(options.none).to.equal(null);
      options.num.should.equal(42);
      options.empty.should.equal('');
      options.text.should.equal('hello');
    });

    it('ignores non-data attributes', function() {
      var el = fixture("<div id='x' class='y' data-real='yes'></div>");

      var options = FoundationNext.Dom.datasetOptions(el);

      options.should.deep.equal({ real: 'yes' });
    });

    it('returns an empty object for elements without data attributes', function() {
      var el = fixture("<div id='plain'></div>");

      (FoundationNext.Dom.datasetOptions(el)).should.deep.equal({});
    });
  });
});
