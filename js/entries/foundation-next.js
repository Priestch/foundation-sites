/**
 * Entry for the jQuery-free plugin layer skeleton (7.0 line A, slice S1).
 *
 * Builds the standalone `foundation-next.js` bundle that sits BESIDE the 6.x
 * `foundation.js` bundle instead of inside it: nothing here touches
 * `window.Foundation`, so the existing bundle surface stays byte-for-byte
 * while the new layer is exercised by the mocha suites (and by the
 * differential suites that run the jQuery and native backends side by side).
 */

import { Registry } from '../foundation.util.registry';
import { Events } from '../foundation.util.events';
import * as Dom from '../foundation.util.dom';

const FoundationNext = { Registry, Events, Dom };

window.FoundationNext = FoundationNext;

export default FoundationNext;
