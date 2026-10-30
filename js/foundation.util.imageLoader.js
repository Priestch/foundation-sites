/**
 * Runs a callback function when images are fully loaded.
 * @param {Object} images - Image(s) to check if loaded. Accepts an element,
 *   a NodeList, an array or a jQuery collection (7.0 line A: the callers
 *   keep passing collections during the mixed state).
 * @param {Func} callback - Function to execute when image is fully loaded.
 */
function onImagesLoaded(images, callback){
  const list = images && images.nodeType === 1 ? [images] : Array.from(images || []);
  var unloaded = list.length;

  if (unloaded === 0) {
    callback();
  }

  list.forEach(function(img){
    // Check if image is loaded
    if (img.complete && typeof img.naturalWidth !== 'undefined') {
      singleImageLoaded();
    }
    else {
      // If the above check failed, simulate loading on detached element.
      var image = new Image();
      // Still count image as loaded if it finalizes with an error. The
      // guard makes the pair idempotent (jQuery's `.one` + `.off` shape:
      // only one of the two events fires the handler).
      var settled = false;
      var handler = function() {
        if (settled) { return; }
        settled = true;
        image.removeEventListener('load', handler);
        image.removeEventListener('error', handler);
        singleImageLoaded();
      };
      image.addEventListener('load', handler);
      image.addEventListener('error', handler);
      image.src = img.getAttribute('src');
    }
  });

  function singleImageLoaded() {
    unloaded--;
    if (unloaded === 0) {
      callback();
    }
  }
}

export {onImagesLoaded};
