# foundation-sites 6.9.0 (master) JavaScript 审计报告

> 审计日期：2026-10-21 ｜ 对象：`master` @ v6.9.0（jQuery 插件体系 + gulp/webpack/rollup 构建）
> 性质：只读审计，为 "6.x 最后一个维护版" 服务。所有结论均经源码核实，行号以当前 master 为准。
> 版本事实核实：jQuery 4.0.0 已于 2026-01-17 正式发布（[官方博客](https://blog.jquery.com/2026/01/17/jquery-4-0-0)、[升级指南](https://jquery.com/upgrade-guide/4.0)）；Babel 8.0.1 已发布（ESM-only，7.29 为桥接版）；ESLint 8 已 EOL（2024-10-05），9.x flat config 为主流；webpack 5 仍是当前 major（5.112.x）；rollup 4.64.x；mocha 12（2026-08 stable）；sinon 22。

---

## 执行摘要

1. **最大的现实威胁是 jQuery 4**：`package.json` 的 peerDependencies 是 `jquery: ">=3.6.0"`，`>=` 会放行 2026-01 发布的 jQuery 4，而代码中有 **约 40 处会在 jQuery 4 下直接抛错**：`.focus()`/`.blur()` 简写（4.0 已移除，~38 处 `.focus()` + 2 处 `.blur()`）、`js/foundation.util.touch.js:120` 的 `.bind()`、`js/foundation.util.keyboard.js:34` 对 jQuery 对象调 `.sort()`（4.0 移除未文档化数组方法）、以及 8 处给 `.css()` 传裸数字（4.0 不再自动补 `px`）。全部是**机械修复、不破坏公开 API**，是 6.x 维护版的第一优先级。
2. **死代码清理收益明确**：core.js 里约 60 行 IE/iOS6 时代的 polyfill（requestAnimationFrame、Function.prototype.bind、Date.now、userAgent 嗅探）、mediaQuery.js 的 matchMedia polyfill（currentStyle/styleSheet）、triggers.js 的 MutationObserver 前缀探测与 IE9 分支、touch.js 的 `createEvent/initMouseEvent` 回退，在 `>= Chrome 100 / Safari 15.4 / Firefox ESR` 目标下全部可安全删除，显著减小 UMD 产物。
3. **插件层存在一批真实 bug，且大多集中在 `_destroy`/`reInit` 路径**：ResponsiveMenu 的 window 监听器命名空间写错导致销毁无效（会复活已销毁插件）、Reveal 与 Dropdown 共用 `body` 上的 `.zf.dropdown` 命名空间互相误杀、Sticky 每次进入 stuck 态叠加 `transitionend` 监听器、Sticky `_setSizes`/`_setBreakPoints` 缺 `return` 导致回调双执行、Orbit 销毁不停计时器、AccordionMenu 销毁漏掉 keydown、Equalizer/OffCanvas 的 `changed.zf.mediaquery` 未命名空间泄漏等。修复全部不需要改公开 API。
4. **Babel 现状是"为不存在的浏览器转译"**：`.browserslistrc` 是 `last 2 versions, > 1%`（曾包含 IE11），把 ES6 class/箭头函数全部降到 ES5。6.x 只需调整 browserslist 目标即可大幅瘦身产物；不必动 webpack/rollup 输出结构。ESM 原生化留给 7.0。
5. **构建链可用但依赖陈旧**：webpack 5（无需动，5.x 仍是当前 major）；rollup 2.79.2 + 已弃维的 rollup-plugin-babel 4 值得升到 rollup 4 + @rollup/plugin-babel（输出格式不变）；根目录 `webpack.config.js` 是无人引用的死文件。
6. **测试基础设施是最大技术债但不宜在 6.x 大动**：mocha-headless-chrome（弃维）+ gulp 手工拼接 `js-tests.js` + 手写 `index.html` + browserstack-runner（补丁版本号甚至对不上安装版本，疑似从未生效）。建议 6.x 只做"保证能跑 + 砍掉 BrowserStack 脚本"，替换为 Playwright/@web/test-runner 放到 7.0。
7. **ESLint 6.8（EOL）+ legacy `.eslintrc` + 已弃维的 gulp-eslint**：升级到 ESLint 9 flat config 是纯 dev 工具改动、零运行时风险，适合放进 6.x。
8. **运行时安全面很小**：源码无 `$.trim/$.type/$.parseJSON` 等已删 API 使用；唯一动态 HTML 入口是 Tooltip `allowHtml`（默认关）与 Interchange html 模式（设计即远程注入），文档加警示即可。devDeps 中 js-yaml 3.12 / sass-lint / browserstack-runner 等已弃维包仅影响构建环境。

---

## 1. jQuery 依赖

### 现状
- `package.json:59-63` peerDependencies：`jquery: ">=3.6.0"`、`motion-ui: latest`、`what-input: >=5.2.10`。yarn.lock 锁定 dev 测试用 jquery 3.7.1。
- 对已废弃/被 jQuery 4 移除的静态 API（`$.trim`、`$.type`、`$.isFunction`、`$.isWindow`、`$.parseJSON`、`$.nodeName`、`$.proxy`、`$.holdReady`、`$.fn.size()`）grep 全库 **0 命中** —— 这部分历史包袱在 6.x 里已清干净。
- 但 2026-01-17 发布的 jQuery 4.0 移除/改变了以下内容，逐一核对结果：

| jQuery 4 变更 | 本仓库命中 | 位置 |
|---|---|---|
| `.bind()` 移除 | 1 处 | `js/foundation.util.touch.js:120`（`$(el).bind('touchstart touchmove touchend touchcancel', …)`，且无命名空间，销毁也解不掉） |
| 未文档化数组方法（push/sort/splice）移除 | 1 处 | `js/foundation.util.keyboard.js:34`：`$element.find(…).filter(…).sort(fn)` —— focusable 排序会直接 TypeError，**影响所有组件的键盘导航** |
| `.focus()`/`.blur()` 方法简写移除（3.4 起弃用） | ~40 处 | `.focus()`：orbit.js:254、tabs.js:87/221/225/229、dropdown.js:206/212/264、foundation.util.keyboard.js:170/174、drilldown.js:228/237/243/248/256/266/273/413/436、accordionMenu.js:150/158/162/166、dropdownMenu.js:184/187/193/199/208、accordion.js:144/150/156/162、offcanvas.js:450/452/572、reveal.js:288/316/484；`.blur()`：orbit.js:390、drilldown.js:490 |
| `.css()` 不再自动补 `px` | 8 处 | orbit.js:158/170、sticky.js:64/330/338、equalizer.js:229/264、drilldown.js:300（`css({height: calcHeight})`，数字来自 data） |
| focusin/focusout shim 移除、focus 顺序按 W3C | 低风险 | tooltip.js:261 `.on('focusout')` 用的是原生事件名，不受影响；Reveal/Dropdown 的 `.on('focus'…)` 绑定不受影响，只有依赖触发顺序的代码理论上受影响 |

### 建议（6.x 可做，全部不破坏公开 API）
- 将 `.focus()` → `.trigger('focus')`、`.blur()` → `.trigger('blur')`（这是 jQuery 官方给 3.4+ 的迁移写法，在 3.6/3.7 下行为一致）。
- `touch.js:120` 的 `.bind()` → `.on()`（同时补命名空间，顺手修销毁）。
- `keyboard.js:34` 的 `.sort()` → 先 `.get()` 再对原生数组排序后重建 jQuery 对象（注意保持 DOM 顺序语义）。
- 8 处 `.css(数字)` 显式拼 `'px'`。
- 完成后 peerDependencies 改为 `"jquery": ">=3.6.0 <4"`（保守）或 `"^3.6.0 || ^4.0.0"`（修复后，并声明在 CI 用 jQuery 3.7 与 4 各跑一遍测试）。
- **备选（最低成本路径）**：若不想动 40 处调用，至少把 peerDeps 收紧为 `<4`，否则 npm 用户装 jQuery 4 会直接坏。

### 风险
- `.trigger('focus')` 与 `.focus()` 在 jQuery 3 下完全等价（后者本来就是简写），风险极低；唯一注意 `orbit.js:390` 的 `.blur()` 在 bullets 上——trigger('blur') 会触发 jQuery 事件而非原生 blur，行为一致（jQuery 3 的 `.blur()` 即 trigger）。
- `keyboard.js` 排序改动需要回归 test/javascript/util/keyboard.js 的 35 个用例（已覆盖 tabindex 排序）。

---

## 2. 废弃浏览器 API / 浏览器嗅探

### 现状与问题（全部经 grep 核实）
| 位置 | 内容 | 目标浏览器下是否死代码 |
|---|---|---|
| `js/foundation.core.js:248-280` | rAF polyfill + `Date.now` polyfill + `performance.now` polyfill + **iOS6 userAgent 嗅探**（:260 `/iP(ad|hone|od).*OS 6/`） | 是。rAF 自 Safari 6.1/FF 23/Chrome 10 起无前缀支持 |
| `js/foundation.core.js:281-308` | `Function.prototype.bind` ES5 polyfill（含 `no-extend-native` eslint-disable） | 是（ES5.1 时代特性） |
| `js/foundation.core.js:310-322` | `functionName()` 的 IE9 `Function.name` 正则回退分支（:311 `typeof Function.prototype.name === 'undefined'`） | 首分支是死代码；函数本身是公开 API `Foundation.getFnName`，保留但可简化 |
| `js/foundation.util.mediaQuery.js:20-67` | matchMedia polyfill（styleMedia / `style.currentStyle` / `style.styleSheet`，IE<=8 路径，:41-50） | 是。matchMedia 全目标浏览器原生 |
| `js/foundation.util.triggers.js:5-13` | `WebKit/Moz/O/Ms + MutationObserver` 前缀探测 | 是，前缀版本早已消亡；可直接 `window.MutationObserver \|\| false` |
| `js/foundation.util.triggers.js:106,115` | `if(!MutationObserver){//fallback for IE 9}` 直触发分支 | 若保留"无 MutationObserver 则 false"则分支本身无害但不可达，可整体删除 |
| `js/foundation.util.touch.js:148-151` | `document.createEvent('MouseEvent') + initMouseEvent` 回退（:139 有 `typeof window.MouseEvent === 'function'` 守卫） | 守卫使回退在所有目标浏览器不可达，可删 |

另：`e.which`/`e.keyCode` 用法（foundation.util.keyboard.js:63、tabs.js:187、slider.js:458）——jQuery 早已建议迁移 `e.key`；jQuery 4 未移除 `which` 规范化（⚠️ 以升级指南为准），6.x 可不动，7.0 一并换。

### 建议
- **6.x**：删除上表前 6 项（core.js 的三个 polyfill + userAgent 嗅探、mediaQuery matchMedia polyfill、triggers 前缀探测与 IE9 分支、touch MouseEvent 回退）。产物体积与可读性收益直接，且都不在公开 API 表面上（`MediaQuery`/`Triggers` 的方法签名不变）。
- 注意 `js/foundation.core.js:246` 的 `window.Foundation = Foundation` 与 `js/entries/plugins/foundation.core.js:25` 的重复全局赋值是**公开契约**（dist 场景依赖），保留到 7.0。

### 风险
- 删 matchMedia polyfill 后，若有人真的在 IE9 使用 6.x，`MediaQuery._init()` 会抛错——6.9.0 的 peerDeps（jquery>=3.6）事实上已放弃 IE9，风险可接受；可在 CHANGELOG 标注。

---

## 3. Babel / 转译需求

### 现状
- `.babelrc`：仅 `{ presets: ["@babel/preset-env"] }`，无 targets；`.browserslistrc`：`last 2 versions` + `> 1%`——在 2026 年这会把所有语法转译到 ES5（`last 2 versions` 历史上含 IE11，preset-env 的 plugin 排序仍按最老目标走）。
- devDeps：`@babel/core`/`@babel/preset-env` ^7.22.10（lock 到 7.25.2）、`gulp-babel` 8、`babel-loader` 9、`rollup-plugin-babel` 4（该包已弃维，继任者是 `@rollup/plugin-babel`）。
- 源码语法水平：ES6+（class、箭头函数、模板串、解构 `mediaQuery.js:182`、rest/spread `foundation.core.utils.js:115`、对象简写）。**没有** optional chaining / nullish —— ES2018-2019 水平，Chrome 100+/Safari 15.4+/FF ESR 全部原生支持。
- 产物策略：webpack UMD（转译）+ rollup cjs/esm（转译）+ rollup es6（**不转译**，`rollup.config.js:57`）。即"免转译版本"已存在。

### 建议
- **6.x**：只动 browserslist，例如 `chrome >= 90, firefox >= 91, safari >= 14, edge >= 90`（或 `defaults and fully supports es6-class` 类写法）。preset-env 随即不再注水，`foundation.js` UMD 体积下降、构建提速。保留转译管线与 `dist/js/foundation.es6.js` 不变。
- 不建议 6.x 引入 core-js/@babel/runtime（源码未用新 API polyfill，无需）。
- **7.0**：ESM-first + 双发布（src 原生 ESM / dist 兜底转译），删 `.babelrc` 换 `babel.config.json` 或直接 esbuild/swc 压缩；那时再谈去 Babel。
- ⚠️ Babel 8.0.1（2026-06）已发布且 ESM-only，gulp-babel 8 与 rollup-plugin-babel 4 都不兼容 Babel 8；6.x 留在 Babel 7.29.x（桥接版）最稳。

### 风险
- browserslist 收紧会让"声称支持 Safari 12 的用户"拿到坏产物——但 framework 从未承诺过这些浏览器的 JS 支持，文档同步声明即可。

---

## 4. 构建

### 现状
- **webpack ^5.88.2**（lock 5.95.0；上游 2026-10 为 5.112.x，5 仍是当前 major，**不存在 webpack 7**——之前"webpack 4 EOL"的担忧不适用于本仓库，已在 6.4 升到 5）。
- `gulp/tasks/javascript.js` 是 dist UMD 的核心：`utils.umdExternals()` 生成 `__FOUNDATION_EXTERNAL__` externals 映射（:19-47），`javascript:plugins` 分两步先编 core 再编其余插件（:73-96），每个 `js/entries/plugins/*.js` 出一个可独立 `<script>` 引入的 UMD 文件。这是 dist 用户的硬契约。
- **rollup 2.79.2** + rollup-plugin-babel 4（`rollup.config.js:2-13`）出 cjs/esm/es6 三个文件；`dist/` 在 git 里，release 时经 `gulp deploy:prep` 重生成。
- 根目录 **`webpack.config.js` 是死文件**：webpack 1 风格（`loaders` 字段、`libraryTarget: 'umd'`、路径 `./_build`），全仓库仅 `bower.json:58` 的打包清单提到它，gulp 任务用的是自带的 `webpackConfig`。另有 `package.json` 里 `browserify.transform babelify`（:~150）引用了并未安装的 babelify。
- `gulp/tasks/javascript.js:113-118` `javascript:deps` 仍把 jquery/motion-ui/what-input concat 成 `vendor.js` 供文档站使用（非 dist 产物）。

### 建议
- **6.x 值得做（小成本）**：
  1. rollup 2 → 4 + `@rollup/plugin-babel` 替换 rollup-plugin-babel（配置改动小：`output.sourcemap`、`format: 'es'/'cjs'` 语义不变）；这是 devDeps 里收益/成本比最高的一项。
  2. 删除根 `webpack.config.js`（或从 bower.json 清单同步移除）；删除 package.json 的 browserify 字段或补装 babelify——二选一，消除"看起来支持其实没验证"的路径。
  3. webpack 5 锁到 5.x 最新补丁（安全修复线），不改机制。
- **不要在 6.x 动**：`__FOUNDATION_EXTERNAL__` UMD entries 机制、dist 目录结构、`VERSIONED_FILES` 流程（`gulp/config.js:63-76`）。
- **7.0**：Vite/esbuild 只作为"docs 站与库开发服务器"的候选；库产物是否保留 UMD 由用户调研决定（本审计不展开）。

### 风险
- rollup 4 要求 Node 18+（engines 已是 >=18，`package.json`）；rollup 4 对 `output.exports: 'named'` + cjs 的告警更严格，`js/foundation.js` 已是 named export，无实际风险。

---

## 5. 插件代码质量（挑最要紧的 15 个）

> 通用背景：`js/foundation.core.plugin.js:22-36` 的 `destroy()` 会把实例自身属性置 null，所以任何"销毁后仍存活的监听器"下一次触发就是 TypeError 或幽灵行为；`Foundation.reInit` 对 jQuery 集合走 `$(this).data('zfPlugin')._init()`（`foundation.core.js:99`）——**绕过 destroy 直接重跑 _init**，是所有"重复绑定"问题的放大器。

1. **Reveal × Dropdown 的 body 命名空间冲突（真 bug）**：`js/foundation.reveal.js:163-171`（overlay 点击）与 `:342`（body 点击）把 handler 绑在 `click.zf.dropdown tap.zf.dropdown` 上，而 `js/foundation.dropdown.js:226/327` 与 `js/foundation.accordionMenu` 之外的 Dropdown `_addBodyHandler`/`_destroy` 用同一命名空间操作 `document.body`。任一 Dropdown 销毁会顺带摘掉 Reveal 的关闭点击，反之亦然。6.x：改成 `zf.reveal` 命名空间（事件名不变，无 API 影响）。
2. **Reveal overlay off/on 命名空间错配（reInit 泄漏）**：`js/foundation.reveal.js:164` `.off('.zf.reveal').on('click.zf.dropdown …')`——off 的命名空间根本罩不住 on 的，`reInit` 一次就叠加一个 overlay 关闭 handler，点一下触发 N 次 close。6.x 修复同上。
3. **ResponsiveMenu 销毁失效（真 bug）**：`js/foundation.responsiveMenu.js:100-102` 用**匿名 handler** 绑 `changed.zf.mediaquery`（无命名空间），而 `_destroy`（:147）`$(window).off('.zf.ResponsiveMenu')` 按命名空间摘——摘不到。销毁后的菜单在换断点时仍会 `_checkMediaQueries()` 并 `new` 出新插件（:137-138）。6.x：仿照 responsiveToggle.js:68-70/130 存引用并按引用 off。
4. **Equalizer 的 window 监听泄漏**：`js/foundation.equalizer.js:57` `$(window).on('changed.zf.mediaquery', this._checkMQ.bind(this))` 无命名空间；`_pauseEvents`（:74-81）与 `_destroy`（:282-285）都只清元素级 handler。`equalizeOn` 用法下每次 destroy/reInit 都漏一个。6.x：存 bound 引用 + 命名空间。
5. **OffCanvas 的两处 window 监听泄漏**：`js/foundation.offcanvas.js:183` 与 `:203` 各绑一个匿名 `changed.zf.mediaquery`，`_destroy`（:597-601）不含。6.x：同上。
6. **Sticky 的 transitionend 叠加泄漏**：`js/foundation.sticky.js:256-258` 每次进入 stuck 态都 `on("transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd", …)`，无命名空间、从不 off（`_destroy` :398-399 只清 resizeme/mutateme）。滚动往复几次后一个元素挂 N 个 handler，每次 transition 都 `_setSizes`。顺带：webkit 前缀事件名在目标浏览器可删。6.x：`.one()` + 命名空间 + destroy 清理。
7. **Sticky `_setSizes` 缺 `return`（逻辑 bug）**：`js/foundation.sticky.js:305-308` `if (!this.canStick) { if(cb) cb(); }` 之后**继续执行**整个函数体；`_setBreakPoints`（:354-357）同样缺 `return`，导致不可 stick 时 cb 被连续调用两次、断点仍被计算。6.x：补 `return;`，两行改动。
8. **Orbit 销毁不停计时器（泄漏 + 幽灵动画）**：`geoSync`（orbit.js:113-125）创建的 `Timer` 是闭包内 `setTimeout` 循环，`_destroy`（:419-421）没有 `this.timer.pause()`/clearTimeout；autoPlay 的 Orbit 销毁后仍持续 `changeSlide`。6.x：destroy 里停表。
9. **AccordionMenu 销毁漏 keydown**：`js/foundation.accordionMenu.js:118` 把 `keydown.zf.accordionMenu` 绑在所有 `li` 上，`_destroy`（:296-304）只 off 了 `a` 的 click。销毁后按方向键 → handler 里访问被置 null 的实例属性 → TypeError。6.x：`this.$element.find('li').off('keydown.zf.accordionMenu')`。
10. **Interchange：load 监听叠加 + html 模式插件初始化失效**：`js/foundation.interchange.js:180-182` 每次 `replace()` 都 `.on('load', …)` 且永不 off（图片多次切换→监听器线性增长）；`:193-199` html 模式里 `$(response).foundation()` 初始化的是**另一份解析出的游离节点**，真正插入 DOM 的节点（`.html(response)` 内部重新解析）拿不到 `zfPlugin` data——注入内容里的插件实际未初始化。6.x：改 `.one()` + 插入后 `Foundation.reflow($element)`（需在 CHANGELOG 标注行为变化）。
11. **Magellan 三连**：`js/foundation.magellan.js:84` `$(window).one('load', …)` 在插件晚于 load 初始化（AJAX/reflow 注入）时**永不触发**（deep-link 滚动与 load 后重算全失效）——项目里明明有 `onLoad()` 工具（:94 已用）却这里没用；`:222-224` `_destroy` 在 deepLinking 且无激活项时 `this.$active[0]` 直接 TypeError；`:224` `window.location.hash.replace(hash, '')` 结果被丢弃，是**无操作死代码**。6.x：改 `onLoad()`、加 `$active.length` 守卫、删死代码（`.replaceState` 实现原意图可选）。
12. **Drilldown 无条件 unwrap**：`js/foundation.drilldown.js:535-537` `_destroy` 总是 `this.$element.unwrap()`，但 `_prepareMenu`（:123-127）只在用户**没**自带 `.is-drilldown` 包裹时才 wrap——用户自备包裹的 DOM 会在 destroy 时被拆掉。对照 `sticky.js:406` 有 `wasWrapped` 检查。6.x：补同样检查。
13. **Reveal 全局 keydown 误伤**：`js/foundation.reveal.js:353-364` `$(window).on('keydown.zf.reveal', …)` 是全局共享名；`close()`（:371-374）与 `_destroy` 都 `$(window).off('keydown.zf.reveal')`——开着两个 modal（`multipleOpened`）关掉一个，另一个的 ESC 失效。6.x：命名空间加 `this.id`。
14. **ResponsiveAccordionTabs 的"假插件探默认值"**：`js/foundation.responsiveAccordionTabs.js:112-127` 为抓 options 在游离 `<ul>` 上真实实例化 Accordion/Tabs 再 destroy——触发 init/destroyed 事件、污染 Keyboard 注册表、还有 try/catch 兜底告警。6.x：直接读 `Accordion.defaults/Tabs.defaults` 合并（输出等价）。另：`:37-39` 构造器里 `return this.options.reflow && this.storezfData || this` 的 reflow 黑魔法可留到 7.0。
15. **Motion/Move 无超时兜底**：`js/foundation.util.motion.js:86` `element.one(transitionend(element), finish)`——元素 `display:none`、动画类缺失或系统关动画时 `transitionend` 永不来，`finish` 不执行：Toggler/Reveal/Orbit 关闭到一半卡住、motion 类残留。6.x：低风险修法是在 `animate()` 里加一个 `element[0].offsetWidth` 触发后的 `getComputedStyle` transitionDuration 检测或 setTimeout 兜底（⚠️ 需要回归视觉测试，`test:visual` 有各组件 fixture）。

落选但值得登记：touch.js:10-15 模块级共享滑动状态（多点触摸错乱，7.0 重写）；triggers.js:244-252 全局 resize/scroll 监听只在 load 时快照元素，之后动态插入的 `[data-resize]` 收不到事件（已知限制，7.0 用 ResizeObserver）；Timer 命名空间取 `Object.keys(elem.data())[0]`（`foundation.util.timer.js:5`）依赖 data 键序，Orbit 下实际发的是 `timerpaused.zf.slide`（侥幸工作，7.0 修）；`foundation.core.js:121-125/167-173` `try/catch/finally{return}` 吞异常反模式；`foundation.util.touch.js:111` `new SpotSwipe($)` 构造器不收参；Slider `addTouch()`（slider.js:445-447 经 `touch.js:120` 的无命名空间 `.bind`）在 `_destroy` 后仍残留（修 touch.js 时一并解决）。

---

## 6. 测试基础设施

### 现状
- 运行器：**mocha-headless-chrome 4.0.0**（zambezi org，多年未实质维护，靠内置 puppeteer 驱动；npm 显示的"活跃"仅是例行发布 ⚠️）跑 `test/javascript/index.html`。
- 装配方式：`gulp/tasks/test.js:30-40` `test:transpile-js` 把 `test/javascript/{core,util,components}/**/*.js` 经 Babel 后 **concat 成单个 `js-tests.js`**（gitignored），`index.html` 手写 script 标签按固定顺序载入 jquery/foundation/mocha/chai/sinon。
- 断言栈：mocha 10.7.3 / chai 4.5.0 / chai-jquery 2.1.0 / **sinon 7.5.0**（当前上游 mocha 12、sinon 22）。
- 跨浏览器：**browserstack-runner 0.9.4** + `patches/browserstack-runner+0.9.2.patch`——⚠️ patch 文件名版本是 0.9.2 而安装的是 0.9.4，patch-package 默认精确匹配版本，**该补丁很可能从未被应用**（`browserstack.json` 还在测 ie_11 / Android 6）。BrowserStack 已于 2025 宣布 2026-11 终止 legacy 自动化服务（⚠️ 以官方公告为准），该脚本寿命将至。
- 覆盖面：19 个组件有测试文件，但 sticky/equalizer/responsiveMenu/responsiveToggle 是**全注释的空壳**；SmoothScroll、Touch、Motion、Timer、Triggers、imageLoader、Positionable 无任何单测；`test/javascript/core/core.js:38-41` 的 `registerPlugin/unregisterPlugin/reInit/reflow` 是**空 pending 用例**——恰恰是第 5 节 bug 集中区。
- `yarn test` 链路是 `yarn build`（含完整 docs 构建）+ sass + JS + bundle 测试，慢且耦合。

### 建议
- **6.x（只保证能跑）**：
  1. 从 `test:*` 脚本摘除 browserstack-runner 与 `browserstack.json`（保留本地 mocha-headless-chrome 或加开关）；删除 patches/ 对应补丁。
  2. （可选，成本 S）写一个 ~50 行的 puppeteer/playwright 脚本直接跑现成的 `test/javascript/index.html` 与 `test/bundle/index.html`，替代 mocha-headless-chrome 而完全不动测试文件结构——这是风险最低的"换引擎不换车身"。
  3. 不建议 6.x 重写测试布局。
- **7.0**：迁移到 @web/test-runner（mocha 语法兼容度高、天然吃 ESM）或 Vitest browser mode / Playwright test；测试文件去 concat 化、改 import。
- 顺带 6.x 低成本补齐：给 core.js 的 reInit/reflow pending 用例填上实现（第 5 节的修复正好需要这些回归测试）。

### 风险
- 换运行器后 CI 环境需自装浏览器（Playwright 自带下载），mocha-headless-chrome 的 `-a no-sandbox` 等 flag 语义要等价迁移。

---

## 7. ESLint

### 现状
- `gulp/tasks/lint.js:17-25` 用 **gulp-eslint 6.0.0**（即 ESLint 6.8.0，2024 前 EOL）读根目录 legacy `.eslintrc`（JSON 格式，`semi: never`、`ecmaVersion: 6`）。yarn.lock 里还残留一个 `eslint@2.13.1`（来自某依赖的 `^2.7.0` 区间 ⚠️）。
- sass 侧是 **gulp-sass-lint / sass-lint**（上游 2021 年已弃维）。
- ESLint 8 已 EOL（2024-10-05）；9.x 默认 flat config；gulp-eslint 本体也已弃维（社区继任 gulp-eslint-new）。

### 建议
- **6.x**：直接升 ESLint 9 + flat config（`eslint.config.js`），lint 任务改为直接调 ESLint Node API 或 `gulp-eslint-new`；规则集可原样平移（本项目规则很薄）。同时把 sass-lint 替换为 stylelint（可选；若想控范围可仅做 ESLint）。这是纯 dev 工具改动，0 运行时风险，还能把第 5 节修复纳入 `no-restricted-syntax` 类防护（如禁 `.bind(`、裸 `.focus()`）。
- **7.0**：再加 eslint-plugin-unicorn / jsdoc 类现代规则集。

### 风险
- flat config 下 `globals: { Foundation: true }` 与 mocha/chai/jquery 环境需要用 `globals` 包显式声明；一次性迁移成本 M，不阻塞。

---

## 8. 安全

### 运行时（js/ 源码）
- 唯一的 HTML 注入口：
  - `js/foundation.tooltip.js:49-57`：`allowHtml: true` 时 `.html(this.options.tipText)`，tipText 默认取自 `title` 属性。默认 `allowHtml: false` 走 `.text()`，属 opt-in 设计；建议文档明确"不可信内容禁止 allowHtml"。
  - `js/foundation.interchange.js:193-199`：html 模式 `$.get(path)` 后 `.html(response)`——**按设计即注入远程 HTML**，依赖"同源/可信规则"约定；配合 `$(response).foundation()` 还有一份节点被重复解析（见第 5 节 #10）。建议文档加 CSRF/同源警示。
  - 字符串拼 HTML 的低风险点：`js/foundation.accordionMenu.js:72`（`submenuToggleText` 等拼进 button HTML，数据来自开发者标记）、`js/foundation.drilldown.js:88`（clone）。均来自站点自身标记，非用户输入，6.x 可不动、7.0 统一 DOM API 构建。
- jQuery 版本面：3.7.1 无已知 XSS；若用户被放行到 jQuery 4 之外的更老版本（`>=3.6.0` 的下限 3.6.0 无 XSS CVE，3.5.x 以下的 `$.htmlPrefilter` XSS 已通过下限规避）。
- devDependencies（仅构建环境，⚠️ 按知识标注，未跑 audit 工具）：`js-yaml 3.12.1`（<3.13.0 存在 `load()` 代码执行 CVE-2019-…，仅 docs 构建消费本地 md front-matter）；`sass-lint`（弃维、传递依赖陈旧）；`browserstack-runner`（运行期下载并执行二进制）；`sinon 7`/`eslint 6`（EOL 而非漏洞）；`panini: latest` 拖入老 handlebars（历史原型污染系列已修，但版本不受锁）。`package.json` 已有 resolutions 压制 glob-parent/minimist 等——这套"手工压制"策略建议在 6.x 用一次 `yarn audit --groups dependencies` 复核。

---

## 9. 其他发现

- `js/typescript/foundation.d.ts` 头部仍是 "Type definitions for Foundation Sites **v6.3.1**" 且被作为 `dist/js/foundation.d.ts` 发布（package.json `typings`）——类型与 6.9 的 API（如 `MediaQuery.is/upTo`、`ignoreMousedisappear`）已脱节。6.x 至少更新版本头与新增公共方法。
- `js/foundation.core.js:246` 与 `js/entries/plugins/foundation.core.js:25` 两处 `window.Foundation =` 赋值——ESM 消费者也挂全局，是 6.x 需保留的兼容行为，7.0 应移除（破坏性）。
- `package.json` 的 `browserify.transform: babelify` 引用未安装包（见第 4 节）；`main/module/jsnext:main/esnext/typings` 五个入口指针中 `jsnext:main` 已是废弃约定（7.0 清理）。
- `VERSIONED_FILES`（gulp/config.js:63-76）要求手工同步 10 个文件的版本号（含 `js/foundation.core.js:5` 的 `FOUNDATION_VERSION` 字符串），无校验任务——6.x 可加一个"deploy:prep 后 diff 校验"步骤，防再次出现版本漂移。
- `test:bundle` 用 requirejs 验 AMD 加载（test/bundle/index.html）——UMD 契约测试值得保留到 7.0 之前。
- `gulp/tasks/javascript.js:2` 顶部 `/* eslint-disable no-script-url */` 与根 `.eslintrc` 的 `no-script-url: 2` 组合暗示历史上有过手滑；lint 收紧后可复查。

---

## 优先级表

| 编号 | 事项 | 优先级 | 建议版本 | 工作量 | 风险 |
|---|---|---|---|---|---|
| P0-1 | jQuery 4 兼容：`.focus()`/`.blur()`→`.trigger()`、touch.js `.bind()`、keyboard.js `.sort()`、8 处 `.css()` 补 px | P0 | 6.x | M | 低（机械替换，回归现有测试） |
| P0-2 | peerDependencies 决策：收紧 `<4` 或修完后放开 `^3.6 \|\| ^4`（与 P0-1 绑定） | P0 | 6.x | S | 中（发布契约） |
| P0-3 | ResponsiveMenu destroy 失效（监听器命名空间错） | P0 | 6.x | S | 低 |
| P0-4 | Reveal/Dropdown body 命名空间互杀 + Reveal overlay off/on 错配 | P0 | 6.x | S | 低 |
| P1-1 | Sticky：`_setSizes`/`_setBreakPoints` 缺 return + transitionend 叠加泄漏 | P1 | 6.x | S | 低 |
| P1-2 | Equalizer / OffCanvas 的 `changed.zf.mediaquery` 泄漏；AccordionMenu keydown 漏 off；Drilldown unwrap；Reveal 全局 keydown | P1 | 6.x | S | 低 |
| P1-3 | Orbit destroy 不停 Timer；Interchange load 叠加 + html 模式初始化；Magellan 三连（one('load')、$active[0] TypeError、死代码） | P1 | 6.x | M | 中（行为变化需 CHANGELOG） |
| P1-4 | 删除 IE/iOS6 polyfill 与嗅探（core/mediaQuery/triggers/touch）+ browserslist 收紧 | P1 | 6.x | M | 中（极老浏览器出局，需公告） |
| P1-5 | rollup 2→4 + @rollup/plugin-babel；删根 webpack.config.js / browserify 字段 | P1 | 6.x | M | 低（产物格式不变，跑 test:bundle 验证） |
| P1-6 | ESLint 6→9 flat config（gulp-eslint → gulp-eslint-new/API） | P1 | 6.x | M | 低 |
| P2-1 | 测试运行器中转：摘 BrowserStack、（可选）Playwright 跑现成 index.html | P2 | 6.x | S–M | 中（CI 变更） |
| P2-2 | Motion `transitionend` 无兜底 + ResponsiveAccordionTabs 假插件探值改读 defaults | P2 | 6.x | S | 中（动画回归） |
| P2-3 | typings 更新（v6.3.1 → 6.9 API）、补 core reInit/reflow 测试用例 | P2 | 6.x | S | 低 |
| P3-1 | 测试栈整体迁移 @web/test-runner/Playwright；chai/sinon/mocha 大版本升级 | P2 | 7.0 | L | 中 |
| P3-2 | 原生 ESM/去 Babel（或 Babel 8）、重构 dist 策略、`e.key` 替换 `e.which`、Touch 模块重写、Triggers 换 ResizeObserver、移除 window.Foundation 副作用 | P2 | 7.0 | L | 高（破坏性） |

## 6.x 维护版本 JS Checklist

- [ ] 全库 `.focus()`→`.trigger('focus')`（38 处）、`.blur()`→`.trigger('blur')`（2 处）
- [ ] `js/foundation.util.touch.js:120` `.bind(` → 带命名空间的 `.on(`（连带修复 Slider addTouch 残留）
- [ ] `js/foundation.util.keyboard.js:34` jQuery 对象 `.sort()` → 原生数组排序
- [ ] 8 处 `.css(数字)` 显式 `'px'`（orbit/sticky/equalizer/drilldown）
- [ ] peerDependencies：`jquery ">=3.6.0 <4"` 或 `"^3.6.0 || ^4"`（CI 用 3.7 与 4 双跑）
- [ ] 删除 `js/foundation.core.js:248-308` polyfill（rAF/Date.now/bind/iOS6 UA）与 IE9 `functionName` 分支
- [ ] 删除 `js/foundation.util.mediaQuery.js:20-67` matchMedia polyfill
- [ ] 简化 `js/foundation.util.triggers.js:5-13` MutationObserver 探测，删 :106/:115 IE9 分支
- [ ] 删除 `js/foundation.util.touch.js:148-151` MouseEvent 回退
- [ ] `.browserslistrc` 收紧到 2026 目标（Chrome 90+/FF 91+/Safari 14+）
- [ ] 修 P0-3/P0-4/P1-1/P1-2 插件销毁与命名空间 bug（ResponsiveMenu、Reveal×Dropdown、Sticky、Equalizer、OffCanvas、AccordionMenu、Drilldown、Reveal keydown）
- [ ] 修 P1-3：Orbit Timer、Interchange load/html 初始化、Magellan 三处
- [ ] rollup 4 + @rollup/plugin-babel；删根 `webpack.config.js`、`browserify` 字段
- [ ] ESLint 9 flat config 迁移 + 新增禁用规则防回归（禁 `.bind(`/裸 `.focus()`）
- [ ] 测试：摘 BrowserStack 脚本与补丁；填 core.js reInit/reflow 用例；保持 mocha-headless-chrome 或 Playwright 中转可跑
- [ ] 更新 `js/typescript/foundation.d.ts`；CHANGELOG 声明浏览器支持下限与 Interchange/Motion 行为变化
