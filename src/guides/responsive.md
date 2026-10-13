| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |---
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |raw: true
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |title: "Responsive, the Yeti way"
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |description: "A component measures its own width, a threshold is a width where behaviour changes, and the three tools that make a layout respond, in the order to reach for them."
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |nav_group: "Guides"
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |nav_order: 5
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |---
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |# Responsive, the Yeti way
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |<p class="lede">Three ideas, in the order they matter. Everything responsive in Yeti follows from them.</p>
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |## A component measures itself
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |A Yeti layout or component never asks how wide the screen is. It asks how wide it is. A `columns` in a sidebar and the same `columns` across the page get different answers and behave differently, with identical markup, because each one reads the box it was put in.
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |```html demo md lg
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |<div class="sidebar">
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |	<nav class="stack"><a href="#">Overview</a></nav>
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |	<div class="columns" data-threshold="sm">
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |		<p>Left</p>
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |		<p>Right</p>
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |	</div>
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |</div>
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |```
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |Here the `columns` sits in the sidebar's main area. When that area is narrower than the `sm` width its children stack; when a wider screen gives the area more room they sit side by side. Nothing about the screen was written down, and the same markup dropped into a full-width `center` behaves the same way relative to its own box.
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |`columns` reaches that answer without a container query: each child's flex basis is `calc((threshold - 100%) * 999)`, hugely negative while the container is wider than the threshold and hugely positive once it is narrower, so the row wraps at the width you named. `hero` switches the same way. Where a component changes more than how it wraps, it declares itself a container and asks its own width in a container query: `nav` folding behind a toggle, `card`, `grid`, `breakout`, `pagination`, `timeline`. Either way the component reads its own box, never the screen. A viewport query, the thing a breakpoint was, appears almost nowhere in the framework, because a component cannot know where on the page it will be used.
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |## A threshold, not a breakpoint
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |A breakpoint is a screen width chosen ahead of time, usually from a list of devices, and every component on the page changes at the same one. A threshold is a width where one component's behaviour changes, chosen from Yeti's width vocabulary, and it belongs to that component alone.
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |The vocabulary is eight stops:
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size || Name | Width | About |
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size || --- | --- | --- |
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size || `2xs` | 12rem | a badge, or a dialog's narrowest size |
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size || `xs` | 16rem | a phone held sideways, or a narrow sidebar |
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size || `sm` | 24rem | a phone, or a card |
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size || `md` | 32rem | a reading column |
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size || `lg` | 48rem | a wide reading column, or two of `sm` |
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size || `xl` | 64rem | a page |
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size || `2xl` | 80rem | a wide page |
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |They are the same names, and the same values, everywhere: `data-threshold="md"` on a `columns`, `data-max="md"` on a `center`, `data-width="sm"` on a `sidebar`. Learn them once. A theme can change the values in one place and every component that reads them moves together.
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |Because a threshold belongs to a component, two components on the same page can change shape at different widths, and one component can be used at two thresholds on the same page. That is the whole difference, and it is why the layouts guide says to unlearn breakpoints rather than translate them.
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |## Three tools, in this order
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |When something has to respond, reach for these in order and stop at the first that works.
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |**Intrinsic sizing first.** Most of the time nothing has to be told a width at all. A `cluster` wraps when its items run out of room. A `grid` with `data-columns` puts as many columns in as fit. A `sidebar` lets its main area take what is left. These respond continuously, at every width, with no threshold, and they are what to try first.
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |```html demo sm md
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |<div class="cluster" data-gap="sm">
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |	<button class="button" type="button">Save</button>
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |	<button class="button" type="button" data-emphasis="medium">Save as draft</button>
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |	<button class="button" type="button" data-emphasis="low">Discard</button>
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |</div>
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |```
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |**A container query second.** When the change is a switch rather than a flow, a row that becomes a stack, a card that puts its picture beside the text, a nav that folds behind a toggle, the component queries its own width against a threshold. In Yeti these are already written: you choose the threshold with an attribute, you do not write the query.
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |```html demo md lg
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |<nav class="nav" aria-label="Site" data-threshold="md">
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |	<a href="#" data-brand>Yeti</a>
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |	<button type="button" popovertarget="menu" aria-label="Menu">☰</button>
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |	<ul id="menu" popover role="list">
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |		<li><a href="#">Docs</a></li>
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |	</ul>
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |</nav>
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |```
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |**A viewport query almost never.** The one thing a component cannot measure is the screen, and the one thing that is legitimately about the screen is the page's outermost frame: whether the `shell` shows its nav beside the main area or above it. Even there Yeti asks the shell's own width, since the shell is the page. If you find yourself writing `@media (width >= …)` around a Yeti component, the component is being asked to know something it should not need to.
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |There is a fourth tool, and it is fourth on purpose: `data-show` and `data-hide` remove an element outright at a container width, instead of changing anything's shape. Reach for it when a thing genuinely has no narrow form — not when writing the narrow form is merely more work. Two versions of one thing are two things to keep in step forever, and the removed one is out of the accessibility tree while it is gone. The [visibility guide](visibility.md) has it, and everything else that hides.
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |## Who reads which width
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size || Attribute | On | What the width means |
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size || --- | --- | --- |
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size || `data-threshold` | `columns`, `hero`, `nav`, `pagination` | at or above it, the wide form |
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size || `data-max` | `breakout`, `center`, `dialog` | the widest the content column, or the dialog, may grow |
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size || `data-width` | `media`, `scroller`, `shell`, `sidebar` | the preferred width of the part it sizes: the media's figure, each item in a scroller, the shell's nav and aside, or the sidebar |
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size || `data-min` | `grid`, `masonry` | the narrowest a column may be before one drops, or `none`, which leaves the count to `data-columns` |
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size || `data-show` | anything inside a `container` or another size container | shown from the stop up |
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size || `data-hide` | anything inside a `container` or another size container | hidden from the stop up |
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |
| `3xs` | 8rem | two abreast on a phone: a link column, a badge list, a small gallery |
| `2xs` | 12rem | a badge, or a dialog's narrowest size |The values are the seven stops above, `none` aside, and every one of them is a token: `--yeti-width-sm` is `24rem` until a theme says otherwise.
