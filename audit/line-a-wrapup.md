# 线 A 收尾报告（S15 进行中 · S14 终态 + S15 增量）

分支 `dev-v7-remove-jquery`（S14/S15 在 worktree 分支上产出，合入时以此为准）。
S14 tip 起点为 9e664cd1c（S13 收口），本报告 S14 定稿于 2026-10-23，S15 增量续记于后（见"六、S15 增量"）。

## 〇、S15 增量（Playwright 切片，进行中）

已完成（提交序列 15:30–16:30）：

1. **测试栈迁移 Playwright**（两个提交：先并存、后切默认）：`test/javascript/playwright-runner.js` 本地 HTTP 服务 + Playwright 打开既有 mocha 页，mocha `end` 事件回写 `window.__mochaDone/__mochaStats/__mochaFailures`，runner 轮询取结果、非零退出。浏览器选择：先试打包 chromium（CI 侧 `npx playwright install chromium`），失败回落系统 Chrome（channel `chrome`；本环境 `npx playwright install chromium` 下载被墙塞住，超时未完成——**本环境结论：用系统 Chrome 或设 `PW_CHROME_CHANNEL`；CI 方案：预装 `npx playwright install chromium` 或直接用 channel chrome**）。mocha-headless-chrome 已从 devDependencies 移除，`test:javascript:units/ci`、`test:bundle` 及 single-process 别名全部走 Playwright；viewport 钉 800x600 与 mocha-headless 对齐（slider/sticky 几何）。yarn.lock 全程 registry.yarnpkg.com，resolutions 7 键未动。
2. **环境漂移修正**（tip 在本机 Chrome 155 基线 726+4fail → 730 全绿）：Reveal `finishUp` 补 destroy 竞态守卫（S14 Orbit 判例同形）；Motion animateIn pin 改断 transition longhand（shorthand 序列化随 Chrome 版本漂移）；SmoothScroll 程序化点击 pin 改用元素原生 `.click()`（jQuery 3.6.3+ special.click._default 对链接抑制原生 click 捷径——jQuery 合成 click 从此过不了桥，归⑨同族公告）。
3. **which→e.key**（P3-2）：`Keyboard.parseKey` 先读 `event.key`（Tab/Enter/Escape/Space/End/Home/四向映射），which/keyCode 回退保留一期；mock 补 `key` 字段（维持 $.Event 形态——jQuery trigger 无法包装真 KeyboardEvent，suite 逐个切真事件派发时 mock 退役）。
4. **首个原生化纵切**（Toggler+Motion+插件基类，import 29→27）：toggler/motion 去掉 jquery import；插件基类收元素或集合双形、init.zf/destroyed.zf 改真冒泡事件（jQuery 监听白吸收照旧）；Motion show/hide 原生 display（Reveal `_show` 判例）、完成回调以元素施用、finished.zf.animate extra 参数切元素；两份 Toggler suite 全原生化（`fixture()` helper 入 lib/utils.js，utils.js 去 jQuery）。
5. **⑦ 文档欠账**：javascript-utilities.md Touch 节改为 `Foundation.Touch.addTouch(el)` + 原生监听，并公告合成事件不再过桥。

S15 实测门禁：`yarn test` 全绿（build + sass 38 + units **729 passing/6 pending** + bundle 1）；`gulp lint` 0/0。**计数微调说明**：730→729，toggler-native destroy 节两条并一条（被钉的 jQuery 侧 off('.zf.toggler') 行已随 import 删除；原两条一条改写为"注册表清空→同元素可再建新实例"，另一条无原生等价物，删除；净 -1）。

### S15 dist 重建差异类别（人工 review 结论）
对比基点 57b3187ee（重建后 sha 记录于流水，blob 未存档，按源 diff 复核类别）：变化 6 个产物（foundation.js、plugins/core、reveal、toggler、util.keyboard、util.motion），全部对应本切片 3 个源提交的编译产物：① jQuery 运行时收窄（toggler/motion 模块工厂不再引 jquery external）；② Reveal finishUp 守卫；③ Keyboard keyNames 映射；④ 插件基类 Events.trigger + 元素归一；⑤ Motion 原生 show/hide + detail 元素 + cb.apply(el)。无逻辑漂移项。

### S15 剩余作业（S16 输入，按依赖链）
- **粗网 27 套件原生化**（除 Toggler×2 外全部；422 处 chai-jquery 断言 → `fixture()` + 原生断言 + `FoundationNext.Dom.visible`——**visible 断言只准用 Dom 实现，双标禁止**；mockKeyboardEvent 消费点随各组件 keydown 绑定翻真事件派发）。
- 随后按 wrapup 第四节链 b→f：dispatchLocal jQuery 半边、detail 全量切元素、`$.extend`×20/`$.isEmptyObject`×2/`$.each`、addToJquery 处置、peerDeps 移除、27 文件 import 归零、fx 缝另切片。

---

## 一、S14 完成项

| 项 | 内容 | 提交 |
|---|---|---|
| 深合并原生化 | `foundation.util.dom.js` 新增 `deepMerge()`（对照 jQuery `$.extend(true)` 逐条核实 3.7 源码）；abide 缝拆除（同提交）；jsdom 对照 harness 全部等价 + 浏览器钉套件 4 组 | e5a123dac |
| interchange `$.get`→fetch | html 模式换 `fetch().then(res=>res.text())`；`res.ok` 对齐 6.x `$.get` 静默失败语义（注释内写明依据）；回调契约不变 | bb760a1eb |
| motion-ui 死引用清理 | 删 `test/javascript/index.html` 死 CSS link；`gulp/config.js` 两处 motion-ui 条目**留**并注明消费方（vendor.js→docs 布局/visual 页的 `window.MotionUI`；SASS_DOC_PATHS→docs.scss `@import 'motion-ui'`） | 14:30 提交 |
| 行为中性清理 | Orbit destroy 加 `if (this.timer)` 守卫（单 slide/无 autoPlay 时 6.x 会抛 TypeError；M1 修复保留）；Sticky `'change.zf.sticky'` off 死行删除（6.x 从未绑过该监听，master grep 证实） | 14:45 提交 |
| 台账与清单定稿 | 本文件 | 15:00+ |

门禁实测（S14 tip 全绿）：**730 passing**（709 起步只增不减）+ 6 pending；`test:sass` 38 passing；`test:bundle` 1 passing；`gulp lint` 0 error 0 warning；无分号（eslint semi: never 通过）。

### deepMerge 等价性证据
- 对照对象：本仓 node_modules 内 jQuery 3.7.1 源码 `jQuery.extend`（L255-325）逐条核实，非凭记忆。
- jsdom harness（14 组形状 + 引用恒等 + 原型链枚举）**全部 ALL EQUIVALENT**：嵌套对象、数组按索引合并（[1,2,3]+[9]→[9,2,3]）、数组进原始值目标、对象进数组目标（kind mismatch 替换）、null 覆盖、undefined 跳过、类型冲突双向、多源顺序、数值键对象、null 源整体跳过、容器内 null、fn/RegExp 引用恒等、**for-in 继承键枚举**（3.7 实测连继承键一起拷贝——初版用 Object.keys 在此 DIFF，已改为 for-in 对齐 jQuery 并加 `__proto__` 污染守卫）、abide 三源合并形状。
- 钉套件 `test/javascript/util/deepMerge.js`（4 组纲领：嵌套对象/数组/null+类型冲突/引用+原型安全），其中 5 条带 jQuery 的 it 在浏览器内直接 `$.extend(true)` 对照（jQuery 缺席时 skip）。
- Abide 默认值中的 validators 函数与 patterns RegExp 合并后**引用不变**（harness + 套件双证）。

### fetch 等价性证据
- 6.x `$.get` 失败行为：内部 success 过滤器只放行 HTTP 2xx，失败静默（无回调、无事件、无状态变化，仅请求本身报 console 错）。
- 落地：`fetch(path).then(res => { if (!res.ok) return; return res.text(); }).then(response => { if (response === undefined) return; …原回调体逐行不动… })`。
- 新增钉测试：成功路径（注入+reflow+replaced 事件+currentPath）、`fetches through window.fetch`、**静默-404**（ok:false：无事件、currentPath 不变、innerHTML 不变）、**静默-网络失败**（rejects：同上）。
- 粗网套件 interchange.js 唯一一处 `$.get` spy 同步改为 `window.fetch` spy（该测试只断言调用参数，语义不变）。

## 二、剩余 jQuery 触点终清单（29 文件逐文件）

统计口径：`grep -l "from 'jquery'" js/` = **29 文件**（S13 为 29，S14 后不变——本切片不背 import 归零指标）。

### A 类：粗网钉死的必留缝（Playwright 切片统一处理）
| 文件 | 剩余 $ API | 缝性质 |
|---|---|---|
| foundation.core.js | `$.each`（reInit 遍历）`$.fn`（addToJquery 挂载） | 6.x 公共 API 面（`$(document).foundation()`），粗网根 |
| foundation.core.utils.js | `rtl()` 读 `$('html')`、`toElement` 收 jQuery 对象 | 公共 util 兼容面 |
| foundation.abide.js | `$(this.inputs)` 等 jQuery 包装（公共方法返回 $）、`$element.data('clickedOn')` 式无 | 返回值形状=公共契约 |
| 全部 20 组件 | `$.extend({}, defaults, datasetOptions(), options)` 浅合并 ×20（dropdownMenu ×7 处、responsiveToggle ×2） | 浅合并是 7.0 决策保留项（datasetOptions 决议），非 deepMerge 范围 |
| responsiveMenu / responsiveAccordionTabs | `$.isEmptyObject` | 可换 `Object.keys().length===0`，归 Playwright 批量 |
| 20 组件的 `$element/$inputs` 公共属性 | jQuery 集合 | 6.x 公共 API（第三方读实例属性），粗网不动 |
| entries/foundation.js、entries/plugins/foundation.core.js | `Foundation.addToJquery($)` | 6.x 装载入口 |

### B 类：S14 已清，仅余注释提及
- abide.js：`$.extend(true)` 缝已拆（注释引用）；`$.merge` 仅存在于 S12 注释（实际代码已是 flat queryAll）。
- interchange.js：`$.get` 缝已拆（注释引用）。

### C 类：mix 态监听双轨（dispatchLocal jQuery 半边的消费面，等 Playwright）
- triggers.js：`dispatchLocal` 双运输（jQuery 半边=粗网监听的事件来源，**S14 未动，出界确认**）；closeableListener fadeOut fx 链。
- reveal/offcanvas/drilldown/dropdown/slider/orbit/tooltip/tabs/accordion/accordionMenu/dropdownMenu/sticky/magellan/smoothScroll/responsiveToggle/toggler/motion/imageLoader/core.utils(ignoreMousedisappear)：粗网 `.on/.off/.trigger` 合成缝（hover 合成、fx 补间、ESC/tap 消费、`$(document).one('mouseenter')`）——全部等 Playwright 切片。

## 三、行为偏差台账（10 条终态）

| # | 条目 | 状态 |
|---|---|---|
| ① | closeme 转发改真冒泡（[data-closable] 祖先被顺带关，6.x 不会） | **已钉测试**（S6 Reveal 特征钉），收尾公告 |
| ② | SmoothScroll 完成回调 2→1 次 + fx 尺寸补间丢弃 | **已钉测试**（S7），收尾公告 |
| ③ | fx slide 缝（accordion slideUp/slideDown/deepLinkSmudge/tooltip fade） | **待定夺**（等用户拍板"原生高度过渡 vs 放弃补间"，另行小切片） |
| ④ | `$primary-color` 前置赋值翻转（线 B B9） | **已定案**（线 B 台账④，与线 A 无关，合并态时进 CHANGELOG 行为变化列） |
| ⑤ | Touch 真事件化：第三方 jQuery 合成 arming（`$.event.special` per-element）不复存在 | **已钉测试**（S13 touch.js），收尾公告（第三方若直接 `.on('tap')` 在 jQuery 侧将收不到合成事件，须用原生监听或 Foundation.Touch 面） |
| ⑥ | MediaQuery watcher 命名空间变化（`changed.zf.mediaquery` 改真事件投递，参数走 detail） | **已钉测试**（S13 mediaquery），收尾公告 |
| ⑦ | `$.spotSwipe` / `$.fn.addTouch` 公共面移除 | **已公告**（S15：docs/pages/javascript-utilities.md Touch 节改写为 `Foundation.Touch.addTouch(el)` + 原生监听，并载明合成事件不再过桥；`Foundation.Touch.addTouch(el)` 是新面，已导出） |
| ⑧ | `Foundation.Touch` 新增导出 | **已定案**（S13，entries/foundation.js:56），收尾公告（新增而非破坏） |
| ⑨ | jQuery 合成 window 事件不再驱动 window 监听 | **已钉测试**（interchange-native"does not consume resizeme on the jQuery side"等），收尾公告 |
| ⑩ | 第三方 `$form.trigger('reset')` 不再达原生监听 | **待公告**（abide 注释+钉头注释已写明；第三方应以原生 `form.reset()` 或真实 submit 触发；收尾公告与 ⑨ 合并为"合成事件不再过桥"一条。SmoothScroll 程序化点击 pin 的改写（S15）同族） |

公告口径建议：①②⑤⑥⑦⑧⑨⑩⑪⑫⑬ 合并为一节"7.0 事件层原生化行为变化"（其中⑪⑫⑬为 S15 新增，随纵切扩散到其余组件时逐条对号），③ 单列"待定夺项"，④ 归线 B CHANGELOG。
S15 新增台账行：

| # | 条目 | 状态 |
|---|---|---|
| ⑪ | 插件基类 `init.zf.*`/`destroyed.zf.*` 从 jQuery 合成（元素本地）改为真冒泡事件（原生监听为第一面，jQuery 直绑监听经白吸收照收；document 级监听从此也能收到） | **已落地+钉**（S15 core.plugin 纵切，core.js 套件原钉全过），随 7.0 公告 |
| ⑫ | `Motion` 收口：完成回调 `this` 从 jQuery 集合改元素；`finished.zf.animate` extra 参数从调用时的 jQuery 集合改动画目标元素；animateIn/Out 的 show/hide 原生 display 处理（清内联+computed 回落 block，同 Reveal `_show` 判例） | **已落地+钉**（S15 motion 纵切，motion.js 套件 pin 同步改写），随 7.0 公告 |
| ⑬ | 组件构造器 7.0 契约收元素（Toggler 首切：`plugin.$element` 为原生元素；混合态 reflow 喂入的 jQuery 集合被展开兼容）；d.ts 与迁移指南在 M3 随全组件铺开 | **进行中**（S15 Toggler 纵切；其余 19 组件随 S16 粗网批次铺开） |

## 四、给 Playwright 切片的完整交接（S15 输入）

1. **前置**：先做测试原生化（mocha-headless-chrome → Playwright），修 test 页加载顺序（S7 发现：index.html 里 foundation.js 先于样式表执行→MediaQuery 读 Times New Roman→断点套件须 `_reInit()`）。
2. **粗网拆除顺序**（依赖链）：
   a. 粗网套件的 jQuery 合成输入改真事件/原生合成（mockKeyboardEvent 不带 `key` 字段，只有 keyCode+which——**which→e.key 支持按出界裁决未做**，切片时可给 mock 加 key 字段做加法支持，Keyboard.handleKey 已兼容 `event.which||event.keyCode`，加 key 读取需 Keyboard 侧小改）；
   b. `dispatchLocal` 删 jQuery 半边（triggers.js:42-46，消费面=C 类清单）；
   c. detail 参数切原生 Element（粗网尾随参数 `function(e,$target)` 读取面同片统一切）；
   d. `$.extend` 浅合并 ×20 → `Object.assign`（datasetOptions 决议保持）+ `$.isEmptyObject` ×2 + `$.each`；
   e. `addToJquery` / `$(document).foundation()` 面的 7.0 处置（本体去留是 7.0 大决策，不在切片内拍板，切片只保证"插件层 import 归零"）；
   f. peerDeps 移除 jquery、29 文件 import 归零（d/e 完成后机械删除）。
3. **fx 缝**（等用户拍板后另行小切片，不并入 Playwright）：accordion slide、drilldown deepLinkSmudge、tooltip fade、closeableListener fadeOut、slider/Reveal 已原生部分不动。
4. **文档欠账**：⑦ 的 `addTouch` 文档行（javascript-utilities.md:148）；`docs/pages/abide.md` 等组件页中 `$().foundation()` 用法在 7.0 的去留说明。
5. **motion-ui 遗留**：vendor.js 保留 MotionUI（本切片裁决）；7.0 发布时 motion-ui peer 关系与 docs 页面去留随 M3。

## 五、不做清单确认（S14 未越界）

- dispatchLocal jQuery 半边**未删**；detail 参数**未切**；which→e.key **未做**（探查结论：mock 无 key 字段，归 Playwright）；peerDeps jquery **未动**；import 归零**未做**（29 文件维持）；fx 缝**未动**。全部按出界清单保持原样。
