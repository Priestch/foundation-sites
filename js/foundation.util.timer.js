import { Events } from './foundation.util.events';

function Timer(element, options, cb, nameSpace) {
  // 7.0 line A terminal form: the element (Timer's only consumer, Orbit,
  // passes the plain element). The paused bookkeeping rode jQuery's data
  // cache (DOM-invisible); the expando property keeps it invisible, and the
  // timer events dispatch through the native layer (the orbit-native suite
  // pins them as jQuery-synthesized under the old engine; the flip makes
  // them real bubbling events - white absorption keeps jQuery listeners
  // hearing them).
  // 7.0 line A, slice S2: the event namespace is passed explicitly. v6
  // inferred it from the element's FIRST jQuery data key, which coupled the
  // event names to jQuery data key order and would break now that core
  // stopped writing zfPlugin there. The probe is retired since S10 - Orbit,
  // the only Timer consumer, passes 'orbit' explicitly - and the default is
  // the flat 'timer' namespace.
  nameSpace = nameSpace || 'timer';

  var _this = this,
      duration = options.duration,//options is an object for easily adding features later.
      remain = -1,
      start,
      timer;

  this.isPaused = false;

  this.restart = function() {
    remain = -1;
    clearTimeout(timer);
    this.start();
  }

  this.start = function() {
    this.isPaused = false;
    // if(!elem.data('paused')){ return false; }//maybe implement this sanity check if used for other things.
    clearTimeout(timer);
    remain = remain <= 0 ? duration : remain;
    element.zfTimerPaused = false;
    start = Date.now();
    timer = setTimeout(function(){
      if(options.infinite){
        _this.restart();//rerun the timer.
      }
      if (cb && typeof cb === 'function') { cb(); }
    }, remain);
    Events.trigger(element, `timerstart.zf.${nameSpace}`);
  }

  this.pause = function() {
    this.isPaused = true;
    //if(elem.data('paused')){ return false; }//maybe implement this sanity check if used for other things.
    clearTimeout(timer);
    element.zfTimerPaused = true;
    var end = Date.now();
    remain = remain - (end - start);
    Events.trigger(element, `timerpaused.zf.${nameSpace}`);
  }
}

export {Timer};
