import { Box } from './foundation.util.box';
import { Plugin } from './foundation.core.plugin';
import { rtl as Rtl } from './foundation.core.utils';

const POSITIONS = ['left', 'right', 'top', 'bottom'];
const VERTICAL_ALIGNMENTS = ['top', 'bottom', 'center'];
const HORIZONTAL_ALIGNMENTS = ['left', 'right', 'center'];

const ALIGNMENTS = {
  'left': VERTICAL_ALIGNMENTS,
  'right': VERTICAL_ALIGNMENTS,
  'top': HORIZONTAL_ALIGNMENTS,
  'bottom': HORIZONTAL_ALIGNMENTS
}

function nextItem(item, array) {
  var currentIdx = array.indexOf(item);
  if(currentIdx === array.length - 1) {
    return array[0];
  } else {
    return array[currentIdx + 1];
  }
}


// jQuery's `.offset({top,left})` setter, for absolutely positioned
// elements: top/left = target page coordinates - the element's current
// page offset + its current computed top/left (robust to any offsetParent;
// static elements get position:relative first, exactly like jQuery).
function setOffset(el, coords) {
  const cs = window.getComputedStyle(el);
  if (cs.position === 'static') { el.style.position = 'relative'; }
  const curTop = parseFloat(cs.top) || 0;
  const curLeft = parseFloat(cs.left) || 0;
  const rect = el.getBoundingClientRect();
  el.style.top = (coords.top - (rect.top + window.pageYOffset) + curTop) + 'px';
  el.style.left = (coords.left - (rect.left + window.pageXOffset) + curLeft) + 'px';
}

class Positionable extends Plugin {
  /**
   * Abstract class encapsulating the tether-like explicit positioning logic
   * including repositioning based on overlap.
   * Expects classes to define defaults for vOffset, hOffset, position,
   * alignment, allowOverlap, and allowBottomOverlap. They can do this by
   * extending the defaults, or (for now recommended due to the way docs are
   * generated) by explicitly declaring them.
   *
   **/

  _init() {
    this.triedPositions = {};
    this.position  = this.options.position === 'auto' ? this._getDefaultPosition() : this.options.position;
    this.alignment = this.options.alignment === 'auto' ? this._getDefaultAlignment() : this.options.alignment;
    this.originalPosition = this.position;
    this.originalAlignment = this.alignment;
  }

  _getDefaultPosition () {
    return 'bottom';
  }

  _getDefaultAlignment() {
    switch(this.position) {
      case 'bottom':
      case 'top':
        return Rtl() ? 'right' : 'left';
      case 'left':
      case 'right':
        return 'bottom';
    }
  }

  /**
   * Adjusts the positionable possible positions by iterating through alignments
   * and positions.
   * @function
   * @private
   */
  _reposition() {
    if(this._alignmentsExhausted(this.position)) {
      this.position = nextItem(this.position, POSITIONS);
      this.alignment = ALIGNMENTS[this.position][0];
    } else {
      this._realign();
    }
  }

  /**
   * Adjusts the dropdown pane possible positions by iterating through alignments
   * on the current position.
   * @function
   * @private
   */
  _realign() {
    this._addTriedPosition(this.position, this.alignment)
    this.alignment = nextItem(this.alignment, ALIGNMENTS[this.position])
  }

  _addTriedPosition(position, alignment) {
    this.triedPositions[position] = this.triedPositions[position] || []
    this.triedPositions[position].push(alignment);
  }

  _positionsExhausted() {
    var isExhausted = true;
    for(var i = 0; i < POSITIONS.length; i++) {
      isExhausted = isExhausted && this._alignmentsExhausted(POSITIONS[i]);
    }
    return isExhausted;
  }

  _alignmentsExhausted(position) {
    return this.triedPositions[position] && this.triedPositions[position].length === ALIGNMENTS[position].length;
  }


  // When we're trying to center, we don't want to apply offset that's going to
  // take us just off center, so wrap around to return 0 for the appropriate
  // offset in those alignments.  TODO: Figure out if we want to make this
  // configurable behavior... it feels more intuitive, especially for tooltips, but
  // it's possible someone might actually want to start from center and then nudge
  // slightly off.
  _getVOffset() {
    return this.options.vOffset;
  }

  _getHOffset() {
    return this.options.hOffset;
  }

  // 7.0 line A terminal form: plain elements (un-migrated callers hand in
  // jQuery collections, unwrapped here).
  _setPosition(anchor, element, parent) {
    anchor = anchor.nodeType === 1 ? anchor : anchor[0];
    element = element.nodeType === 1 ? element : element[0];
    if (parent) { parent = parent.nodeType === 1 ? parent : parent[0]; }
    if(anchor.getAttribute('aria-expanded') === 'false'){ return false; }

    if (!this.options.allowOverlap) {
      // restore original position & alignment before checking overlap
      this.position = this.originalPosition;
      this.alignment = this.originalAlignment;
    }

    // S13: the Box util reads plain elements; the offset write below is
    // the native port of jQuery's `.offset({top,left})` setter.
    setOffset(element, Box.GetExplicitOffsets(element, anchor, this.position, this.alignment, this._getVOffset(), this._getHOffset()));

    if(!this.options.allowOverlap) {
      var minOverlap = 100000000;
      // default coordinates to how we start, in case we can't figure out better
      var minCoordinates = {position: this.position, alignment: this.alignment};
      while(!this._positionsExhausted()) {
        let overlap = Box.OverlapArea(element, parent || null, false, false, this.options.allowBottomOverlap);
        if(overlap === 0) {
          return;
        }

        if(overlap < minOverlap) {
          minOverlap = overlap;
          minCoordinates = {position: this.position, alignment: this.alignment};
        }

        this._reposition();

        setOffset(element, Box.GetExplicitOffsets(element, anchor, this.position, this.alignment, this._getVOffset(), this._getHOffset()));
      }
      // If we get through the entire loop, there was no non-overlapping
      // position available. Pick the version with least overlap.
      this.position = minCoordinates.position;
      this.alignment = minCoordinates.alignment;
      setOffset(element, Box.GetExplicitOffsets(element, anchor, this.position, this.alignment, this._getVOffset(), this._getHOffset()));
    }
  }

}

Positionable.defaults = {
  /**
   * Position of positionable relative to anchor. Can be left, right, bottom, top, or auto.
   * @option
   * @type {string}
   * @default 'auto'
   */
  position: 'auto',
  /**
   * Alignment of positionable relative to anchor. Can be left, right, bottom, top, center, or auto.
   * @option
   * @type {string}
   * @default 'auto'
   */
  alignment: 'auto',
  /**
   * Allow overlap of container/window. If false, dropdown positionable first
   * try to position as defined by data-position and data-alignment, but
   * reposition if it would cause an overflow.
   * @option
   * @type {boolean}
   * @default false
   */
  allowOverlap: false,
  /**
   * Allow overlap of only the bottom of the container. This is the most common
   * behavior for dropdowns, allowing the dropdown to extend the bottom of the
   * screen but not otherwise influence or break out of the container.
   * @option
   * @type {boolean}
   * @default true
   */
  allowBottomOverlap: true,
  /**
   * Number of pixels the positionable should be separated vertically from anchor
   * @option
   * @type {number}
   * @default 0
   */
  vOffset: 0,
  /**
   * Number of pixels the positionable should be separated horizontally from anchor
   * @option
   * @type {number}
   * @default 0
   */
  hOffset: 0,
}

export {Positionable};
