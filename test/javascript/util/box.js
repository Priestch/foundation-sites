// S13 pins (7.0 line A): the Box util is jQuery-free and its callers now
// hand it plain elements. The pure math keeps accepting jQuery collections
// (GetDimensions unwraps them), so both input forms are pinned side by side,
// along with the tooltip/dropdown positioning regression (position classes
// and inline offsets must not move).
describe('Foundation box', function () {
  var html;
  var plugin;

  afterEach(function () {
    if (html) {
      html.remove();
    }
    if (plugin && plugin.$element) {
      plugin.destroy();
    }
    plugin = null;
  });

  describe('GetDimensions()', function () {
    it('should be unable to get dimensions for window', function(done) {
      try {
        Foundation.Box.GetDimensions(document.querySelector("window"));

        should.fail();
      } catch (err) {
        done();
      }
    });

    it('should be unable to get dimensions for document', function(done) {
      try {
        Foundation.Box.GetDimensions(document.querySelector("document"));

        should.fail();
      } catch (err) {
        done();
      }
    });

    it('height and width of element', function () {
      html = document.body.appendChild(fixture('<div id="rect-test" style="height: 100px;width:200px;"></div>'));

      var dims = Foundation.Box.GetDimensions(document.querySelector("#rect-test"));

      dims.width.should.equal(200);
      dims.height.should.equal(100);
    });

    it('parent height of element', function () {
      html = document.body.appendChild(fixture('<div style="height: 200px;"><div id="rect-test-parent" style="height: 100px;width:200px;"></div></div>'));

      var dims = Foundation.Box.GetDimensions(document.querySelector("#rect-test-parent"));

      dims.width.should.equal(200);
      dims.height.should.equal(100);

      dims.parentDims.height.should.equal(200);
    });

    it('reads the same dimensions from a plain element as from the jQuery collection (S13 input form)', function () {
      html = document.body.appendChild(fixture('<div id="rect-test-both" style="height: 100px;width:200px;"></div>'));

      var fromCollection = Foundation.Box.GetDimensions(document.querySelector("#rect-test-both"));
      var fromElement = Foundation.Box.GetDimensions(document.getElementById('rect-test-both'));

      fromElement.width.should.equal(fromCollection.width);
      fromElement.height.should.equal(fromCollection.height);
      fromElement.offset.top.should.equal(fromCollection.offset.top);
      fromElement.offset.left.should.equal(fromCollection.offset.left);
    });
  });

  describe('ImNotTouchingYou / OverlapArea (native inputs, S13)', function () {
    it('detects collisions against the window for a plain element', function () {
      // position: fixed pins the rect to the viewport, so the window-based
      // check is independent of the runner page's body size
      html = document.body.appendChild(fixture('<div id="box-inside" style="position: fixed; top: 10px; left: 10px; width: 50px; height: 50px;"></div>'));
      var el = document.getElementById('box-inside');

      Foundation.Box.ImNotTouchingYou(el, null, true).should.be.true;

      // push it out of the viewport on the left: not touching anymore
      el.style.left = '-80px';
      Foundation.Box.ImNotTouchingYou(el, null, true).should.be.false;
      (Foundation.Box.OverlapArea(el, null) > 0).should.be.true;
    });

    it('detects collisions against a parent element passed as a plain node', function () {
      html = document.body.appendChild(fixture('<div id="box-parent" style="position: relative; width: 100px; height: 100px; overflow: visible;"><div id="box-child" style="position: absolute; top: 0; left: 0; width: 50px; height: 50px;"></div></div>'));
      var parent = document.getElementById('box-parent');
      var child = document.getElementById('box-child');

      Foundation.Box.ImNotTouchingYou(child, parent).should.be.true;

      child.style.left = '80px';
      Foundation.Box.ImNotTouchingYou(child, parent).should.be.false;

      // lrOnly only counts the horizontal axis
      Foundation.Box.ImNotTouchingYou(child, parent, true).should.be.false;
      child.style.left = '40px';
      Foundation.Box.ImNotTouchingYou(child, parent, true).should.be.true;
    });
  });

  describe('GetExplicitOffsets (native inputs, S13)', function () {
    it('computes bottom/center offsets for plain elements', function () {

      html = document.body.appendChild(fixture("<div><div id='box-anchor' style='position: absolute; top: 100px; left: 100px; width: 40px; height: 40px;'></div><div id='box-pane' style='position: absolute; width: 30px; height: 30px;'></div></div>"));

      var anchor = document.getElementById('box-anchor');
      var pane = document.getElementById('box-pane');

      var offsets = Foundation.Box.GetExplicitOffsets(pane, anchor, 'bottom', 'center', 10, 0);

      // anchor top (100) + anchor height (40) + vOffset (10)
      offsets.top.should.equal(150);
      // anchor left (100) + anchor width/2 (20) - pane width/2 (15)
      offsets.left.should.equal(105);
    });
  });

  describe('positioning regression (tooltip/dropdown, S13 param flip)', function () {
    it('keeps the dropdown position classes and inline offsets intact', function () {

      html = document.body.appendChild(fixture("<div><button type='button' data-toggle='box-dd'>toggle</button><div class='dropdown-pane' data-dropdown id='box-dd'>Pane</div></div>"));

      plugin = new Foundation.Dropdown(document.querySelector('#box-dd'), {});
      plugin.open();

      var pane = document.getElementById('box-dd');
      pane.classList.contains('has-position-bottom').should.be.true;
      pane.classList.contains('has-alignment-left').should.be.true;
      // the position landed as an inline offset (the write stays on
      // element.offset(), reading back through the style)
      pane.style.top.should.not.equal('');
    });

    it('keeps the tooltip position classes and inline offsets intact', function () {
      html = document.body.appendChild(fixture('<span id="box-tip-anchor" class="has-tip" data-tooltip aria-describedby="box-tip" data-is-focus>anchor</span>'));
      plugin = new Foundation.Tooltip(document.querySelector('#box-tip-anchor'), {});
      plugin.show();

      var template = plugin.template;
      template.classList.contains('top').should.be.true;
      template.style.top.should.not.equal('');
      template.style.left.should.not.equal('');
    });
  });
});
