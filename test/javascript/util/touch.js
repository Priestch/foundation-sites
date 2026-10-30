// S13 pins (7.0 line A): the Touch util synthesizes tap/swipe as real,
// bubbling CustomEvents through the Events layer. These tests drive the
// actual touch-event chain (touchstart -> touchmove -> touchend with faked
// touch lists, exactly what a real digitizer delivers) and pin the 6.x
// equivalence: same events, same delivery targets, same extra-parameter
// shapes on the detail.
describe('Touch (native synthesis)', function() {
  var $html;

  afterEach(function() {
    if ($html) {
      $html.remove();
      $html = null;
    }
  });

  // Builds a touch event like the test keyboard mock: a real Event with the
  // touch lists attached (the util reads e.touches/e.changedTouches only).
  // The fake touch carries `target` like a real Touch does - the addTouch
  // replay dispatches the mouse event on it.
  function touchEvent(type, target, pageX) {
    var event = new Event(type, { bubbles: true, cancelable: true });
    var touches = [{ pageX: pageX, pageY: 10, clientX: pageX, clientY: 10, identifier: 1, target: target }];
    event.touches = touches;
    event.changedTouches = touches;
    event.targetTouches = touches;
    return event;
  }

  function swipe(element, fromX, toX) {
    element.dispatchEvent(touchEvent('touchstart', element, fromX));
    element.dispatchEvent(touchEvent('touchmove', element, toX));
  }

  function tap(element) {
    element.dispatchEvent(touchEvent('touchstart', element, 10));
    element.dispatchEvent(touchEvent('touchend', element, 10));
  }

  it('synthesizes a tap on the touched element from a still touch', function() {
    $html = $('<div id="touch-tap-pin">tap me</div>').appendTo('body');
    var el = $html[0];
    Foundation.Touch.init();

    var nativeSpy = sinon.spy();
    FoundationNext.Events.on(el, 'tap', nativeSpy);
    var jqSpy = sinon.spy();
    $html.on('tap', jqSpy);

    tap(el);

    sinon.assert.calledOnce(nativeSpy);
    // the tap landed as a real event: the jQuery listener absorbs it and
    // the source touchstart rides the detail (6.x passed it as the event
    // object's properties)
    sinon.assert.calledOnce(jqSpy);
    jqSpy.firstCall.args[0].type.should.equal('tap');
    jqSpy.firstCall.args[0].originalEvent.detail[0].type.should.equal('touchstart');
  });

  it('bubbles the tap like the 6.x jQuery synthetic walk: body bindings hear taps on descendants', function() {
    $html = $('<div id="touch-bubble-pin"><span id="touch-bubble-inner">inner</span></div>').appendTo('body');
    var inner = document.getElementById('touch-bubble-inner');
    Foundation.Touch.init();

    var bodySpy = sinon.spy();
    FoundationNext.Events.on(document.body, 'tap', bodySpy);

    tap(inner);

    sinon.assert.calledOnce(bodySpy);
    // the target is the touched element, not the dispatch root
    bodySpy.firstCall.args[0].target.should.equal(inner);
  });

  it('synthesizes swipe, swipeleft and swiperight with the 6.x extra parameters', function() {
    $html = $('<div id="touch-swipe-pin">swipe me</div>').appendTo('body');
    var el = $html[0];
    Foundation.Touch.init();

    var swipeSpy = sinon.spy();
    var leftSpy = sinon.spy();
    var rightSpy = sinon.spy();
    FoundationNext.Events.on(el, 'swipe', swipeSpy);
    FoundationNext.Events.on(el, 'swipeleft', leftSpy);
    FoundationNext.Events.on(el, 'swiperight', rightSpy);

    // 200 -> 100: 100px leftward within the time threshold
    swipe(el, 200, 100);

    sinon.assert.calledOnce(swipeSpy);
    sinon.assert.calledOnce(leftSpy);
    sinon.assert.notCalled(rightSpy);
    // the direction rides the detail after the touchmove event, exactly
    // where the jQuery trigger put it
    swipeSpy.firstCall.args[1].type.should.equal('touchmove');
    swipeSpy.firstCall.args[2].should.equal('left');
    leftSpy.firstCall.args[1].type.should.equal('touchmove');

    // and back to the right
    swipe(el, 100, 220);
    sinon.assert.calledOnce(rightSpy);
    swipeSpy.secondCall.args[2].should.equal('right');
  });

  it('keeps the 6.x thresholds: a short or slow drag is no swipe and no tap', function() {
    $html = $('<div id="touch-threshold-pin">hold me</div>').appendTo('body');
    var el = $html[0];
    Foundation.Touch.init();

    var tapSpy = sinon.spy();
    var swipeSpy = sinon.spy();
    FoundationNext.Events.on(el, 'tap', tapSpy);
    FoundationNext.Events.on(el, 'swipe', swipeSpy);

    // below the 75px move threshold: didMoved wins, no tap either
    swipe(el, 200, 160);
    sinon.assert.notCalled(swipeSpy);
    sinon.assert.notCalled(tapSpy);
  });

  it('addTouch replays touch input as real mouse events (the slider drag feed)', function() {
    $html = $('<div id="touch-feed-pin">drag me</div>').appendTo('body');
    var el = $html[0];
    Foundation.Touch.init();
    Foundation.Touch.addTouch(el);

    var mousedownSpy = sinon.spy();
    var mouseupSpy = sinon.spy();
    FoundationNext.Events.on(el, 'mousedown', mousedownSpy);
    FoundationNext.Events.on(el, 'mouseup', mouseupSpy);

    el.dispatchEvent(touchEvent('touchstart', el, 5));
    el.dispatchEvent(touchEvent('touchend', el, 5));

    sinon.assert.calledOnce(mousedownSpy);
    sinon.assert.calledOnce(mouseupSpy);
    // coordinates replayed from the touch origin
    mousedownSpy.firstCall.args[0].clientX.should.equal(5);
  });
});
