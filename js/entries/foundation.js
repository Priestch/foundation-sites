
import { Foundation } from '../foundation.core';
import * as CoreUtils from '../foundation.core.utils';
import { Box } from '../foundation.util.box'
import { onImagesLoaded } from '../foundation.util.imageLoader';
import { Keyboard } from '../foundation.util.keyboard';
import { MediaQuery } from '../foundation.util.mediaQuery';
import { Registry } from '../foundation.util.registry';
import { Motion, Move } from '../foundation.util.motion';
import { Nest } from '../foundation.util.nest';
import { Timer } from '../foundation.util.timer';
import { Touch } from '../foundation.util.touch';
import { Triggers } from '../foundation.util.triggers';
import { Abide } from '../foundation.abide';
import { Accordion } from '../foundation.accordion';
import { AccordionMenu } from '../foundation.accordionMenu';
import { Drilldown } from '../foundation.drilldown';
import { Dropdown } from '../foundation.dropdown';
import { DropdownMenu } from '../foundation.dropdownMenu';
import { Equalizer } from '../foundation.equalizer';
import { Interchange } from '../foundation.interchange';
import { Magellan } from '../foundation.magellan';
import { OffCanvas } from '../foundation.offcanvas';
import { Orbit } from '../foundation.orbit';
import { ResponsiveMenu } from '../foundation.responsiveMenu';
import { ResponsiveToggle } from '../foundation.responsiveToggle';
import { Reveal } from '../foundation.reveal';
import { Slider } from '../foundation.slider';
import { SmoothScroll } from '../foundation.smoothScroll';
import { Sticky } from '../foundation.sticky';
import { Tabs } from '../foundation.tabs';
import { Toggler } from '../foundation.toggler';
import { Tooltip } from '../foundation.tooltip';
import { ResponsiveAccordionTabs } from '../foundation.responsiveAccordionTabs';


// Add Foundation Utils to Foundation global namespace for backwards
// compatibility.
Foundation.rtl = CoreUtils.rtl;
Foundation.GetYoDigits = CoreUtils.GetYoDigits;
Foundation.transitionend = CoreUtils.transitionend;
Foundation.RegExpEscape = CoreUtils.RegExpEscape;
Foundation.onLoad = CoreUtils.onLoad;

Foundation.Box = Box;
// 7.0 plan B: the Registry is the public instance-lookup surface (the
// $.fn.foundation dispatch is gone).
Foundation.Registry = Registry;
Foundation.onImagesLoaded = onImagesLoaded;
Foundation.Keyboard = Keyboard;
Foundation.MediaQuery = MediaQuery;
Foundation.Motion = Motion;
Foundation.Move = Move;
Foundation.Nest = Nest;
Foundation.Timer = Timer;
// S13: Touch gained an explicit native surface (addTouch, init), so it is
// exported on Foundation like the other utils.
Foundation.Touch = Touch;

// Touch and Triggers init are side-effect driven, just idempotent setup.
Touch.init();
Triggers.init($, Foundation);
MediaQuery._init();

Foundation.plugin(Abide, 'Abide');
Foundation.plugin(Accordion, 'Accordion');
Foundation.plugin(AccordionMenu, 'AccordionMenu');
Foundation.plugin(Drilldown, 'Drilldown');
Foundation.plugin(Dropdown, 'Dropdown');
Foundation.plugin(DropdownMenu, 'DropdownMenu');
Foundation.plugin(Equalizer, 'Equalizer');
Foundation.plugin(Interchange, 'Interchange');
Foundation.plugin(Magellan, 'Magellan');
Foundation.plugin(OffCanvas, 'OffCanvas');
Foundation.plugin(Orbit, 'Orbit');
Foundation.plugin(ResponsiveMenu, 'ResponsiveMenu');
Foundation.plugin(ResponsiveToggle, 'ResponsiveToggle');
Foundation.plugin(Reveal, 'Reveal');
Foundation.plugin(Slider, 'Slider');
Foundation.plugin(SmoothScroll, 'SmoothScroll');
Foundation.plugin(Sticky, 'Sticky');
Foundation.plugin(Tabs, 'Tabs');
Foundation.plugin(Toggler, 'Toggler');
Foundation.plugin(Tooltip, 'Tooltip');
Foundation.plugin(ResponsiveAccordionTabs, 'ResponsiveAccordionTabs');

export {
  Foundation,
  CoreUtils,
  Box,
  onImagesLoaded,
  Keyboard,
  MediaQuery,
  Motion,
  Nest,
  Timer,
  Touch,
  Triggers,
  Abide,
  Accordion,
  AccordionMenu,
  Drilldown,
  Dropdown,
  DropdownMenu,
  Equalizer,
  Interchange,
  Magellan,
  OffCanvas,
  Orbit,
  ResponsiveMenu,
  ResponsiveToggle,
  Reveal,
  Slider,
  SmoothScroll,
  Sticky,
  Tabs,
  Toggler,
  Tooltip,
  ResponsiveAccordionTabs
}

export default Foundation;

