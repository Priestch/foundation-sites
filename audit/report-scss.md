# Foundation for Sites v6.9.0 — SCSS/CSS 纯清理维护版本审计报告

审计日期：2026-10-21（只读调查，未修改任何项目文件）。所有结论基于逐文件 grep/读取核实，版本信息经 Web 核实（Dart Sass、sass-lint、stylelint、sass-true、foundation-sites 发布状态），无法核实处标 ⚠️。

## 执行摘要

1. **Sass 编译器迁移已完成**：项目早已从 node-sass 迁到 Dart Sass（`gulp-sass ^5.1.0` + `sass-embedded ^1.79.3`，`package.json`、`gulp/tasks/sass.js:4`），斜杠除法、`darken()/lighten()` 均已清零。真正的新风险：`^1.79.3` 允许自动升到 Dart Sass 1.97.0（2026-10 最新），**1.80.0 起正式废弃 `@import` 与全局内建函数**，一次全新 `yarn install` 就会淹没构建日志。
2. **`@import` 共 116 处、12 个文件**（`scss/foundation.scss` 50 处、`scss/prototype/_prototype.scss` 20 处等）。迁 `@use` 会改变用户 settings 导入约定 → **7.0**；6.x 只需锁版本 + `silenceDeprecations`。
3. **三套遗留子系统并存**：float grid（`scss/grid/` 约 940 行）+ xy-grid（`scss/xy-grid/` 约 1150 行）、prototype（24 文件 1530 行、`!important` 大户、独立产物 167K 比主产物还大）、RTL 独立构建。6.x 一律**只做文档级 deprecated 标记**，代码删除全部 7.0（类名/mixin 是公开 API）。
4. **browserslist 是性价比最高的修复点**：`.browserslistrc` 仅 `last 2 versions` + `> 1%`；`last 2 versions` 无用量门槛，**IE 10/11 作为 IE 家族"最后两个版本"永远入选**——2024-09 构建的 `dist/css/foundation.css` 因此仍含 23 处 `display: -ms-flexbox`、约 150 处 2009 规格 `-webkit-box-*` 前缀。收紧查询即可让 autoprefixer 自动剥掉死前缀（SCSS 源码零改动）。
5. **lint 已死**：`gulp-sass-lint ^1.4.0` + 7.7K `.sass-lint.yml`。建议 6.x 迁 **stylelint 16.x + stylelint-scss**（17.x ESM-only，与本项目 CJS gulp 不兼容）。
6. **Sass 测试用 sass-true legacy API**（`test-module`/`test`/`assert-equal`，6 文件约 34 用例，只覆盖 util 函数）。v8 仍兼容但 **True 9.0 将删除旧 API 与 Mocha 支持**；机械改名适合 6.x。
7. **发现真实 bug**：`scss/util/_math.scss:103-104` 括号错位，`type-of(nth($fraction, 1) == 'number')` 把比较写进 `type-of()`，守卫恒真，非法输入不被拦截（影响 `grid-column()`/`xy-cell()` 路径）。修复仅影响传错参数场景，适合 6.x。
8. **normalize vendored v8.0.0**（`scss/vendor/normalize.scss:4`，上游 8.0.1）；`scss/settings/_settings.scss` 899 行 / 23,276 字节 / **490 个顶层变量经反向扫描无死变量**；拆分放 7.0。

---

## 1. Sass 编译器

**现状** `gulp/tasks/sass.js:4` 用 `require('gulp-sass')(require('sass-embedded'))`。无 node-sass/libsass。Dart Sass 适配已完成：`darken(`/`lighten(` 0 处；`$a/$b` 除法 0 处，由手写长除法 `divide()`（`scss/util/_math.scss:158-196`，含 px/em/rem/% 单位换算表）替代；5 个文件已 `@use "sass:color"/"sass:math"`（`scss/components/_table.scss:11`、`scss/util/_mixins.scss:9`、`scss/util/_color.scss:5`、`scss/util/_math.scss:5`、`scss/settings/_settings.scss:63`），颜色用 `color.channel()` 新 API（`scss/util/_color.scss:33-36`）；`!global` 24 处（`scss/components/_off-canvas.scss:77-89`、`scss/foundation.scss:86,90`、`scss/util/_mixins.scss:329,340,374`）。Web 核实：Dart Sass 最新 1.97.0（2026-10）；1.80.0（2024-09）正式废弃 `@import`、全局内建函数；2.0 将移除 `@import`，截至 2026-10 未发布；1.87+ 有 `silenceDeprecations`。

**问题** (a) `^1.79.3` 语义化允许装到 1.97 → 116 处 `@import` + 83 处 `map-*` 调用（另有大量 `type-of`/`unit`/`nth`）每次编译刷 deprecation 警告；(b) `divide()` 可在 7.0 用 `math.div` 替换但非 drop-in（不做跨单位换算）；(c) gulp-sass 处于维护模式，风险低。

**建议（6.x）** P0：锁 `sass-embedded ~1.97.0` 并在 `gulp/tasks/sass.js` 配 `silenceDeprecations: ['import', 'global-builtin']`；P1：`docs/pages/sass.md` 增补 deprecation 说明。**7.0**：`math.div` 替换 `divide()`。**风险**：锁版本属 devDependency，对用户零影响；不锁则 CI 结果取决于当天 npm 最新版。

## 2. @import 模式

**现状** 116 条 `@import` / 12 文件：foundation.scss 50、prototype 20、forms 11、util 10、xy-grid 8、grid 8、typography 4、其余为聚合/shim。`@forward` 0 处；`@use` 仅限 5 个内建模块，未模块化任何项目文件。用户侧约定依赖 import 顺序（`docs/pages/sass.md:76-87`；`scss/settings/_settings.scss:62-64` 是 `@use "sass:color"; @import 'util/util';` 混搭）；四个 `assets/*.scss` 入口均 `@import '../scss/foundation'`。

**问题** settings 变量全局作用域是 116 文件生效前提，`foundation-everything()`（`scss/foundation.scss:80-146`）还靠 `!global` 反写（24 处）；迁 `@use` = 重写配置传递机制。

**建议** **6.x 不迁**（会破坏公开 API 与用户 settings 习惯；成本在 `!global`/490 变量作用域语义而非 import 本身）；只做锁版本 + 静音警告。**7.0**：`@use`/`@forward` + `sass:meta` `configuration()`（参考 Bootstrap 5.3 模式），用官方 `sass-migrator module` 起步。**风险**：7.0 不做则在 Dart Sass 2.0 发布（⚠️ 无日期承诺）时无法编译；6.x 期间用户自装 sass ≥1.80 会在其项目里看到警告，只能文档缓解。

## 3. 重复/遗留子系统

**3a. 双网格** `scss/grid/`（9 文件约 943 行，`_grid.scss:8-33` 定义 `$grid-column-alias`/`$block-grid-max` 等）vs `scss/xy-grid/`（9 文件约 1150 行，平行变量 `$xy-block-grid-max`，`scss/xy-grid/_xy-grid.scss:32-33`）。`foundation-everything($flex,$xy-grid)`（`scss/foundation.scss:80-105`）切换三路径；`foundation-float.css`（128.5K）与 `foundation.css`（157.5K）并存；`test/visual/{grid,flex-grid,xy-grid}/` 三套视觉测试齐全。`$global-flexbox` 分支 54 处 / 11 文件（`scss/components/_menu.scss` 19 处），默认 true（`scss/_global.scss:112`，6.4 起）。
建议：**6.x 文档级 deprecated**（grid.md/flex-grid.md/flexbox-mode.md 加 callout + 源文件 SassDoc 注释；`.row/.columns` 是公开 API 不能删）；**7.0** 删 `scss/grid/` 全部、54 处分支、float 产物与 `$flex` 参数。风险：7.0 删除需在 6.x 公告迁移指引。

**3b. Prototype** 24 partial / 1530 行，默认关闭（`scss/foundation.scss:81` `$prototype: false`），文档定位清晰（`docs/pages/prototyping-utilities.md`："disabled by default"、`!important` 说明）。建议：**6.x 仅文档标记**（可选：`foundation-prototype.css` 降级出 `DIST_FILES`，`gulp/config.js:69-78`，需维护者拍板，默认不动）；**7.0 删除或拆独立包**（推荐后者）。风险低。

**3c. RTL** `assets/foundation-rtl.scss` 构建前写死 `$global-text-direction: rtl`；全库 **0 处**逻辑属性（`padding-inline`/`inset-inline`/`text-align: start` grep 为 0）；`docs/pages/rtl.md` 仍指引用已下线的 customizer。建议：**6.x 修文档**；**7.0 逻辑属性重写 + 删产物**（逻辑属性需 Safari ≥14.1/Chrome ≥87，6.x 不可行）。

## 4. 浏览器兼容 hack（手写部分，逐处核实）

| 位置 | 内容 | 处置建议 |
|---|---|---|
| `scss/components/_visibility.scss:155-166` | `.show-for-ie/.hide-for-ie` + `@media (-ms-high-contrast)` | 公开类名 + 文档（`docs/pages/visibility.md:134-138`）→ 6.x 文档 deprecated，7.0 删 |
| `scss/forms/_select.scss:72-74` | `::-ms-expand` | 无害，7.0 删 |
| `scss/forms/_progress.scss:85-90` | `::-ms-fill` | 同上 |
| `scss/forms/_range.scss:109-140` | `::-ms-track/-thumb/-fill-lower/-fill-upper` | 同上 |
| `scss/_global.scss:194` | `-ms-interpolation-mode: bicubic`（IE7 图片 hack） | **6.x 直接删**（纯死代码） |
| `scss/xy-grid/_frame.scss:82` | `-webkit-overflow-scrolling: touch`（iOS13 起 no-op） | **6.x 直接删** |
| `scss/xy-grid/_frame.scss:83` | `-ms-overflow-style: -ms-autohiding-scrollbar` | 7.0 删 |
| `scss/components/_card.scss:124-128` | IE11 flexbug #75 修复（`min-height: 1px`） | 无害，7.0 删 |
| `scss/grid/_flex-grid.scss:120` | IE10/11 flex-basis 修复 | 随 float grid 7.0 处理 |
| `scss/util/_mixins.scss:146-171` | 箭头 mixin 的 base64 PNG fallback（IE 不支持编码 SVG 时代产物） | 6.x 标 deprecated，7.0 删 |
| `scss/vendor/normalize.scss` | v8.0.0 自带 IE10/11 修正（:57,116,139,256 等） | 随 8.0.1 升级处理 |

`behavior:`/`expression()`/`progid`/条件注释：全库 0 处。**风险提示**：删 CSS 规则对用户是可见变更（recompile diff 出现删除行），6.x 只删"对任何现存浏览器无效"的属性，其余 deprecated 过渡，CHANGELOG 单列。

## 5. browserslist / autoprefixer

**现状** `.browserslistrc` 全文为 `# Browsers that we support` + `last 2 versions` + `> 1%`。autoprefixer `^10.4.15` 经 `gulp/tasks/sass.js:27,41` 挂载；doiuse `^6.0.2` 在 `gulp/tasks/check.js:19` 同配置做特性检查；`yarn.lock` 锁 `caniuse-lite 1.0.30001664`（2024-06 数据）。实测 2024-09-27 构建的 `dist/css/foundation.css`：`display:-ms-flexbox` 23 处、`-ms-flex-*` 家族约 80 处（IE10 2012 规格）、`-webkit-box-*`（2009 规格）约 150 处、`-webkit-box-shadow` 35 处、`-webkit-transform` 67 处。原因：`last 2 versions` 无用量门槛，IE 家族最后两版恒为 IE10+11；caniuse 老 Android/WebKit 条目贡献 `-webkit-box`。⚠️ 2025-2026 caniuse-lite 数据曾中断更新，精确映射需构建时 `npx browserslist` 确认。文档侧更过时：`docs/pages/sass.md:29-36` 建议 `['last 2 versions','ie >= 9','android >= 4.4','ios >= 7']`；`compatibility.md` 称 IE9+/Android 4.4+；`flexbox-mode.md` 称 IE/Edge 10+、iOS 7+。

**建议** **6.x（P0）**改为显式底线（建议 `chrome >= 110 / edge >= 110 / firefox >= 115 / firefox_esr / safari >= 15.4 / ios_saf >= 15.4 / samsung >= 17 / not dead`），autoprefixer 自动移除全部 `-ms-flex*`、`-webkit-box-*`、大部分 `-webkit-transform/transition`——源码零改动、dist 瘦身；同步改写三处文档。**7.0** 随逻辑属性/`@use` 再抬线。**风险**：dist 大 diff 需 release notes 显著说明"不再含 IE/旧 Android"；IE 用户可自配 autoprefixer 重编译（文档讲清 Sass 用户与 dist 用户差别）。

## 6. 设置文件与变量

**现状** `scss/settings/_settings.scss`：899 行 / 23,276 字节；ToC 57 节、**编号缺 56**（`// 55. Top Bar` 后直接 `// 57. Xy Grid`）；顶层变量 **490 个**，逐个反向 grep 扫描 **0 死变量**；调色板为 6.5+ 带引号键新格式（:69-76），旧 `$primary-color` 等经 `scss/util/_color.scss:16-21`（issue #12080 补丁）+ `add-foundation-colors()`（:158-180）兼容；在 `VERSIONED_FILES`（`gulp/config.js:49`）但无版本头（版本头只在 `scss/foundation.scss:3`）。

**问题** 无死变量、无坏结构——拆分是体验优化而非纠错；仅 ToC 编号小瑕疵。

**建议** **6.x**：只修 ToC 注释，**不拆文件**（拆分会破坏用户"整文件覆盖"升级习惯，diff 无法对照）。**7.0**：随 `@use` 迁移拆 `settings/_global|_grid|_components/...` + configuration 函数化。风险：低（6.x 不动即无风险）。

## 7. Lint 工具链

**现状** `gulp-sass-lint ^1.4.0` + `.sass-lint.yml`（7.7K；头部自述 sass-lint 不支持若干 scss-lint 规则；property-sort-order 巨型自定义序已整体置 0）。`gulp/tasks/lint.js` 有 `lint:sass`（failOnError）/`lint:graceful:sass`；`yarn build` 只跑 `lint:graceful`（`gulpfile.js:26`）。Web 核实：sass-lint 官方废弃并指向 stylelint；stylelint 16.x 为 CJS 兼容主流，**17.x ESM-only 且移除 CommonJS API**（本项目 gulp 全 `require()`）。

**问题** sass-lint 不再维护 = 不支持新语法，lint 静默失效。

**建议** **6.x（P1，M）**：迁 `stylelint@^16` + `stylelint-scss` + `stylelint-config-standard-scss`（经 gulp-postcss 挂载或 CLI，勿上 17）；平移核心规则（indent 2、hex 小写短格式、no-duplicate-properties、nesting-depth ≤3、命名规范），其余先关，迁移 PR 用"全集+禁用注释先行"。删 `gulp-sass-lint` 与 `.sass-lint.yml`。**7.0**：随代码瘦身收紧并评估升 17。风险：存量告警量大，分步收紧；对用户零影响。

## 8. Sass 测试

**现状** `test/sass/test_sass.js:4,15-20` 用 `sassTrue.runSass({describe,it,sass}, file)` 注入 sass-embedded。6 文件约 34 个用例（breakpoint 15、color 4、components 3、selector 3、unit 5、value 6），**全部是 util 函数级**（breakpoint/对比度/单位换算/grid-column），无组件 mixin 断言。风格为 legacy API（`test/sass/_breakpoint.scss:8,11` 的 `test-module`/`test`/`assert-equal`）。版本 `sass-true ^8.0.0`、`mocha ^10.7.3`。Web 核实：v8 仍以 deprecated alias 兼容旧名，**True 9.0 将删除旧 alias 与 Mocha 支持**（项目更名 SassUnit）。

**建议** **6.x（P1，S）**：6 个测试文件机械改名 `test-module`→`describe`、`test`→`it`；锁 `sass-true ~8`。**7.0**：测试自身迁 `@use`、评估 SassUnit CLI。**风险**：极低；现有断言为纯函数、无废弃语法，静态评估在 dart-sass 下可通过（CI Node 18/20/22 已在跑 `yarn test:sass`）。

## 9. normalize / 依赖 SCSS

**现状** normalize 为 **vendored**：`scss/vendor/normalize.scss:4` 注明 `normalize.css v8.0.0`，包在 `@mixin foundation-normalize()`，由 `scss/_global.scss:141` 挂载；不依赖 normalize-scss npm 包。sassy-lists `^3.0.1` 构建期拷到 `_vendor/`（`gulp/tasks/sass.js:15-18`），仅测试用。motion-ui：`peerDependencies` 写 `"latest"`（非合法 semver range）、devDep `^2.0.5`；Foundation SCSS 不含/不 import motion-ui（仅 `scss/components/_orbit.scss:72` 有 `.no-motionui` 类名），文档站自行 `@import 'motion-ui'`（`docs/assets/scss/docs.scss:14,23`）——独立包模式无需改。`foundation-docs` 是 **GitHub 未钉版本依赖**（`"foundation-docs": "github:foundation/foundation-docs"`），文档站 SCSS 构建不可复现。

**建议（6.x，P1）**：normalize → v8.0.1（上游仅旧 Edge/IE button overflow 修复，现代浏览器零 diff）；`motion-ui` peer 改 `"^2.0.5"`；`foundation-docs` 钉 commit。**7.0**：评估 normalize 去留/回 npm 化。风险：normalize 升级改变 dist 一行，CHANGELOG 注明。

## 10. 其他发现

1. **真实 bug**：`scss/util/_math.scss:103-104` `type-of(nth($fraction, 1) == 'number')` 括号错位 → 守卫恒真。调用方 `scss/grid/_column.scss:19`、`scss/xy-grid/_cell.scss:21,61`。6.x 修复（改 `type-of(nth(...)) == 'number'`）。
2. `.flex-video` shim：`scss/components/_flex-video.scss` 全文一行 `@import 'responsive-embed';`；别名类仍输出（`scss/components/_responsive-embed.scss:44-58`，dist 6 处）→ 6.x 文档 deprecated，7.0 删类。
3. `foundation-everything()`（`scss/foundation.scss:80-91`）的 `$xy-grid: $xy-grid` 自引用默认 + `!global` 反写，依赖变量遮蔽规则，7.0 module 化改造点。
4. legacy 分发渠道：`bower.json`（main 指向 scss）、`sache.json`（死站）、`package.nuspec`、`package.js`+`meteor-README.md`+`.versions`（Meteor）；`VERSIONED_FILES`（`gulp/config.js:41-50`）仍要求同步这些文件。6.x 仅修文档引用，7.0 删除。
5. customizer 已下线但 `docs/pages/rtl.md`、`kitchen-sink.md` 等仍引用；`scss/` 内 `zurb` 品牌残留 0 处（已清完），仅 docs 文案残留。
6. `docs/pages/typography-base.md`、`flexbox-utilities.md` 已有 deprecate 说明，可作其余 deprecated 文档模板。
7. `foundation-prototype.css`（167.1K）> `foundation.css`（157.5K），佐证 prototype 拆包建议。

---

## 优先级表

| # | 事项 | 建议版本 | 优先级 | 工作量 | 风险 |
|---|---|---|---|---|---|
| 1 | 修 `_math.scss:103-104` 括号 bug | 6.x | P0 | S | 低 |
| 2 | 锁 `sass-embedded`（~1.97）+ `silenceDeprecations` | 6.x | P0 | S | 低 |
| 3 | 收紧 `.browserslistrc`（去掉隐式 IE10/11），重建 dist | 6.x | P0 | M | 中（dist 大 diff） |
| 4 | 删 `-ms-interpolation-mode`、`-webkit-overflow-scrolling` 死属性 | 6.x | P1 | S | 低 |
| 5 | sass-true 迁 `describe`/`it`，锁 `~8` | 6.x | P1 | S | 低 |
| 6 | sass-lint → stylelint 16 + stylelint-scss | 6.x | P1 | M | 中 |
| 7 | normalize 8.0.0 → 8.0.1 | 6.x | P1 | S | 低 |
| 8 | 文档 deprecate：float grid、prototype、RTL、`.flex-video`、`.show-for-ie` | 6.x | P1 | M | 低 |
| 9 | 支持线文档更新 + `motion-ui` peer `^2.0.5` + 钉 foundation-docs | 6.x | P1 | S | 低 |
| 10 | SassDoc `@deprecated` 源码标记 | 6.x | P2 | S | 低 |
| 11 | `@use`/`@forward` 迁移 + configuration 化 settings + `math.div` | 7.0 | P0 | L | 高 |
| 12 | 删 float grid + `$global-flexbox` 分支（54 处）+ float 产物 | 7.0 | P0 | M | 高 |
| 13 | prototype 删除或拆包 | 7.0 | P1 | M | 中 |
| 14 | RTL 逻辑属性重写，删 rtl 产物 | 7.0 | P1 | L | 中 |
| 15 | 删 IE hack（`.show-for-ie`、`::-ms-*`、card/flex-grid 修复、PNG fallback） | 7.0 | P1 | S | 中 |
| 16 | settings 拆分 | 7.0 | P2 | M | 中 |
| 17 | 删 legacy 渠道（bower/sache/nuspec/meteor）并精简 VERSIONED_FILES | 7.0 | P2 | S | 低 |

## 6.x 维护版本 SCSS 清单（checklist）

**编译器/工具链**
- [ ] `package.json`：`sass-embedded` 精确锁定（`~1.97.0`）；`gulp/tasks/sass.js` 加 `silenceDeprecations: ['import','global-builtin']`
- [ ] 删 `gulp-sass-lint` + `.sass-lint.yml`，新增 stylelint@^16 + stylelint-scss + stylelint-config-standard-scss，改 `gulp/tasks/lint.js`
- [ ] `test/sass/` 6 文件：`test-module`→`describe`、`test`→`it`；锁 `sass-true ~8`

**正确性**
- [ ] 修 `scss/util/_math.scss:103-104`

**浏览器目标**
- [ ] `.browserslistrc` 换显式底线；`npx browserslist --debug` 核对；重建 `dist/css/*`
- [ ] 删 `scss/_global.scss:194`、`scss/xy-grid/_frame.scss:82`
- [ ] 更新 `docs/pages/sass.md`（autoprefixer 建议）、`compatibility.md`、`flexbox-mode.md`

**依赖**
- [ ] `scss/vendor/normalize.scss` → v8.0.1（注明 vendored+版本）
- [ ] `package.json`：`motion-ui` peer `"^2.0.5"`；`foundation-docs` 钉 commit

**文档级 deprecated（不改代码）**
- [ ] grid.md / flex-grid.md / flexbox-mode.md：float grid 与 `$global-flexbox:false` 标 7.0 移除
- [ ] prototyping-utilities.md：标 7.0 移除/拆包；rtl.md：删 customizer 段落
- [ ] responsive-embed.md：`.flex-video` deprecated；visibility.md：`.show-for-ie/.hide-for-ie` deprecated
- [ ] `scss/grid/_grid.scss`、`scss/grid/_flex-grid.scss`、`scss/components/_flex-video.scss`、`scss/components/_visibility.scss` 文件头 SassDoc `@deprecated`

**杂项**
- [ ] settings ToC 56 号缺位加注释；CHANGELOG 单列所有改变 CSS 输出的条目

**明确推迟 7.0**：`@use` 迁移、settings 拆分、float grid/prototype/RTL 产物删除、IE 类与 `::-ms-*` 删除、`divide()`→`math.div`、legacy 渠道文件删除。
