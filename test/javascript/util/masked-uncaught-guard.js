// Headless file:// runs (mocha-headless-chrome) surface exactly one
// cross-origin-masked uncaught per page load: window.onerror receives
// message "Script error." with empty url/line/col and no error object, at a
// page-load-dependent instant that scales with how long the run takes. Mocha
// attributes it to whichever test is current, failing an unrelated test at
// random (observed landing on Slider's changed.zf.slider and Tooltip's show).
// It carries no stack and CDP reports no matching exception, so it is not
// attributable to library or test code. Swallow exactly that empty artifact
// shape here; every other uncaught still reaches mocha, and raw exceptions
// remain visible on the runner's stderr via its pageerror hook.
var __maskedGuardTimer = setInterval(function() {
  if (typeof window.onerror === 'function' && !window.__maskedGuardInstalled) {
    window.__maskedGuardInstalled = true;
    clearInterval(__maskedGuardTimer);
    var origOnerror = window.onerror;
    window.onerror = function(msg, url, line, col, err) {
      if (msg === 'Script error.' && !url && !line && !col && !err) {
        console.warn('masked-uncaught-guard: swallowed page-load "Script error." artifact');
        return false;
      }
      return origOnerror.apply(this, arguments);
    };
  }
}, 3);
