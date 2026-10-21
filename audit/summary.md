# foundation-sites 6.x 维护版本评估总报告（汇总）

- 日期：2026-10-21
- 基线：master 分支 v6.9.0（f5c7d29db），不含 develop（"Yeti"）分支的重写
- 方法：三个独立审计 agent（SCSS/CSS、JavaScript、整体架构）只读调查后汇总；所有结论经源码核实（文件:行号），版本信息经公开渠道核实，个别未核实项标 ⚠️
- 子报告：
  - [report-scss.md](report-scss.md) — SCSS/CSS 审计
  - [report-js.md](report-js.md) — JavaScript 审计
  - [report-architecture.md](report-architecture.md) — 架构与技术栈评审

---

## 一、总体结论

1. **基于 master 做 6.10.0 纯维护版本完全可行**：没有 node-sass 式的硬死点（Sass 编译已是 sass-embedded，webpack 已是 5，Node 22 已被 CI 证明可跑），"能跑"的底子是有的——但这个"能跑"高度依赖 yarn.lock 钉住的一堆停滞/废弃依赖，属于脆弱平衡。
2. **三个最紧迫问题**：
   - **jQuery 4 已经来了**：4.0.0 于 2026-01-17 正式发布，而 peerDependencies 写的 `jquery: ">=3.6.0"` 会放行 4.x，代码中约 **40 处调用会在 jQuery 4 下直接抛错**（`.focus()`/`.blur()` 简写、`.bind()`、jQuery 对象 `.sort()`、`.css(裸数字)` 不补 px）。**维护者已确认不为 jQuery 4 做兼容准备**（2026-10-21；7.0 将整个移除 jQuery），6.x 仅收紧 peer 为 `">=3.6.0 <4"`，防止包管理器自动升级踩坑。
   - **browserslist 隐含支持 IE 10/11**：`last 2 versions` 无用量门槛，IE 家族"最后两个版本"永远入选。dist CSS 至今含 23 处 `display:-ms-flexbox`、约 150 处 2009 规格 `-webkit-box-*`。改一行配置即可让 autoprefixer 自动剥掉。
   - **CI/测试基建已半死**：BrowserStack 链三重死（runner 停更、patch 续命、apt 包在 Ubuntu 24.04 已删除）应直接删除；actions v3 已弃用；mocha-headless-chrome 承载全部 JS 测试且停滞（6.x 保它，7.0 换 Playwright）。
3. **推荐版本定位 6.10.0**："依赖大扫除 + Node/浏览器基线提升 + bug 修复 + 死文件清理"。**零公开 API 破坏**：所有 mixin/变量/类名、`Foundation` 全局、插件名、data 属性、事件名、dist 产物形态全部不变。
4. **凡是"删除功能"的事一律推 7.0**：float 网格、prototype、RTL 产物、`@use` 迁移、放弃 ES5 dist、文档链替换等。

---

## 二、浏览器支持基线（核心问题之一）

| | 配置 | 实际最低浏览器 |
|---|---|---|
| **现状** | `.browserslistrc`: `last 2 versions` + `> 1%`（无 `not dead`） | **隐含 IE 10/11**、旧 Android；dist JS 按含 IE11 的目标输出 ES5 |
| **6.x 建议** | 显式：`chrome >= 100, edge >= 100, firefox >= 115, firefox_esr, safari >= 15.4, ios_saf >= 15.4, samsung >= 17, not dead` | 2022 年代浏览器（Chrome 100+ / FF ESR 115+ / Safari 15.4+）；SCSS 报告建议 Chrome/Edge 取 110，与架构报告的 100 有小分歧，见"决策点" |
| **7.0 建议** | `defaults` 或显式：`chrome/edge >= 120, firefox >= 128, safari >= 17, ios >= 17` | 2023-24 年代浏览器，配合 Babel 8 放弃 ES5 dist |

基线提升的连带清理（6.x）：
- autoprefixer 自动剥掉 `-ms-flex*`、`-webkit-box-*`、大部分 `-webkit-transform/transition` —— **SCSS 源码零改动，dist 瘦身**
- 删 `gulp/tasks/deploy.js` 的 `clean-css compatibility:"ie11"`（customizer 任务里的 `"ie9"` 一并处理）
- 删 JS 侧死 polyfill/嗅探：`js/foundation.core.js:248-308`（rAF/Function.bind/iOS6 UA）、`js/foundation.util.mediaQuery.js:20-67`（IE<=8 matchMedia）、`js/foundation.util.triggers.js:5-13,106,115`（MutationObserver 前缀探测 + IE9 fallback）、`js/foundation.util.touch.js:148-151`
- 删 CSS 死属性（对任何现存浏览器无效的）：`scss/_global.scss:194`（IE7 `-ms-interpolation-mode`）、`scss/xy-grid/_frame.scss:82`（`-webkit-overflow-scrolling`）
- 文档：`docs/pages/sass.md`、`compatibility.md`、`flexbox-mode.md` 里的支持线声明严重过时（还写着 IE9+/Android 4.4+）
- ⚠️ 必须 CHANGELOG 显著声明：dist CSS 字节变化、"不再含 IE/旧 Android 前缀"；6.x **只动 CSS 侧基线，JS dist 维持 ES5**（CDN 最后一公里，避免回滚定位困难）

---

## 三、Node 支持基线

| | engines | CI 矩阵 | 说明 |
|---|---|---|---|
| **现状** | `>=18.0` | 18/20/22 × 三平台 | 18/20 均已 EOL，声明失效 |
| **6.x 建议** | `>=20` | **22、24**（ubuntu 必测；保守方案：保持 `>=18` 只给 CI 加 24） | 2026-10 在保 LTS 为 22/24；依赖树无 native 编译重灾区 |
| **7.0 建议** | `>=22` 或发布时在保 LTS 集合 | 24、26 | 发布预计 2027，以 24 为最低在保线 |

⚠️ 最大未知数：mocha-headless-chrome（内嵌旧 puppeteer）在 Node 24 上的兼容性，6.x 开工第一步就要验证；同时 CI 的 `deploy:commit` 硬编码 `git push origin develop`，master 化维护后首次发版就会撞墙，必修。

---

## 四、依赖处置汇总（三份报告合并）

### 4.1 移除（6.x，全部零用户影响）

| 项 | 原因 | 出处 |
|---|---|---|
| browserstack-runner + browserstack.json + patches/ 整目录 + 相关 scripts + CI job | runner 停更多年、patch 版本号与安装版本不符疑似从未生效、browserstack.json 还在测 ie_11/Android 6 | 架构 + JS |
| gulp4-run-sequence | 声明了但零引用 | 架构 |
| gulp-sass-lint + .sass-lint.yml | sass-lint 2018 年停更（拉 2018 年 eslint 2.13.1）；替换方案见决策点 2 | SCSS + 架构 |
| bower.json、sache.json、package.js、meteor-README.md、.versions、package.nuspec | Bower/Sache/Meteor/NuGet 渠道全死，Meteor 版本停在 6.5.3 | 架构 + SCSS |
| 根目录 webpack.config.js | webpack 1 风格死文件，仅 bower.json 引用 | JS + 架构 |
| package.json 的 browserify/babelify/jspm 字段 | 引用未安装包/渠道边缘化 | JS + 架构 |
| package.json 的 resolutions（6 条） | 历史漏洞补丁化石，升级后逐条验证可否删 | 架构 |

### 4.2 升级/修复（6.x）

| 项 | 现状 → 目标 | 说明 |
|---|---|---|
| rollup | 2.79.2 + 已废弃的 rollup-plugin-babel 4 → **4.64.x + @rollup/plugin-babel** | 6.x 唯一非 caret 升级；只在发版期跑，平时测试不覆盖，升级后必须 `deploy:prep` 演练 + diff dist |
| sass-embedded | ^1.79.3（会漂到 1.97）→ **锁 ~1.97.0 + `silenceDeprecations:['import','global-builtin']`** | 1.80 起废弃 @import，不锁则全新 install 后构建日志被警告淹没 |
| jQuery peer | `>=3.6.0` → **收紧 `">=3.6.0 <4"`**（已确认不做 jQuery 4 兼容） | 一行改动，防止自动升级到 4.x；~40 处机械修复不再列入 |
| motion-ui peer | `"latest"`（非合法 semver）→ `"^2.0.5"` | |
| js-yaml | 3.12.1 → 4.x（一处 `safeLoad`→`load`） | 3.x 有已知 CVE，仅构建期 |
| normalize（vendored） | scss/vendor/normalize.scss 8.0.0 → 8.0.1 | 现代浏览器零 diff |
| ESLint | 6.8.0（EOL）→ 9 flat config（gulp-eslint → gulp-eslint-new），可加禁 `.bind(`/裸 `.focus()` 防回归规则 | 见决策点 3 |
| caret 内跟进 | webpack 5、postcss、autoprefixer、mocha、sass-true、Babel 7.29.x | 保持 7.x/5.x 大版本不动 |
| 幻影依赖 rimraf | 未声明但被 4 个 gulp 任务 require → 显式声明 ^3 或改 `fs.rmSync` | lock 重排随时可能炸 clean/deploy |
| CI actions | checkout/setup-node v3 → v4/v5 | v3 被强停即 CI 全灭 |
| foundation-docs / panini / markdown 处理器 | github 依赖钉 commit；`latest` 改确切版本 | 安装可复现性 |

### 4.3 保持不动（6.x）

gulp 4、Babel 7（ES5 dist）、webpack 5、webpack-stream、mocha-headless-chrome（唯一 runner）、sinon 7、chai 4、panini 文档链、sassy-lists/_vendor、requirejs（AMD bundle 测试在用）、corejs-typeahead（docs 在用）、**dist 跟踪 git**（CDN 直链是 6.x 最重要的兼容承诺）、四个 CSS 变体、全部 JS API / SCSS 接口。

### 4.4 推迟到 7.0

gulp 保持（2026-10-21 维护者确认：不引入 Vite，构建链不更换；届时最多评估就地升 gulp 5）；Babel 8（ESM-only）+ 原生 ESM dist；Playwright 替换 mocha-headless-chrome；mocha/sinon/chai 大版本；eslint 10；stylelint 17；`@use`/`@forward` 模块化 + settings 拆分 + `math.div`；删 float grid / prototype / RTL 产物 / sassy-lists / typeahead / requirejs；RTL 逻辑属性重写；删全部 IE hack 类与 `::-ms-*`；文档链替换（Eleventy/VitePress）；dist 是否出 git。

---

## 五、6.x 必修的真实 bug（源码核实）

**P0**
- ~~jQuery 4 兼容机械修复~~（2026-10-21 确认不做，~40 处清单留在 report-js.md §1 供参考）；改为：peerDependencies 收紧 `">=3.6.0 <4"`
- `scss/util/_math.scss:103-104` `type-of()` 括号错位，参数校验恒真（影响 `grid-column()`/`xy-cell()`）
- ResponsiveMenu 销毁失效（`js/foundation.responsiveMenu.js:100-102,147` 匿名 handler 摘不掉）
- Reveal×Dropdown body 命名空间互杀 + `js/foundation.reveal.js:164` off/on 错配

**P1（销毁/泄漏路径）**
- Sticky：`!canStick` 分支缺 `return`（:305-308, :354-357）；stuck 态反复叠加 transitionend 监听（:256）
- Equalizer/OffCanvas window 监听无命名空间不清理；AccordionMenu keydown 漏 off（销毁后按键 TypeError）；Drilldown 无条件 unwrap 拆用户包裹；Reveal 全局共享 keydown（multipleOpened 下 ESC 失灵）
- Orbit destroy 不停 Timer；Interchange 每次 replace 叠加 load 监听 + html 模式初始化游离节点；Magellan `one('load')` 永不触发 / deepLinking TypeError / 死代码

**P2**
- Motion 无 transitionend 兜底；ResponsiveAccordionTabs 游离节点黑魔法；typings 头部停在 v6.3.1；补 registerPlugin/reInit/reflow 测试用例（现恰为 pending/空壳，正是 bug 集中区）

---

## 六、6.x vs 7.0 边界（一页版）

**6.10.0（零破坏）**：CI 修复与 BrowserStack 摘除 → jQuery 4 兼容 + bug 修复 → browserslist/silenceDeprecations/死代码删除 → 重建 dist + 人工 diff → 死文件死依赖清理 → rollup 4/stylelint/eslint9/caret 升级 → 文档 deprecated 标记（float grid/prototype/RTL/.flex-video/.show-for-ie）+ CHANGELOG → 发版演练。

**7.0（破坏性）**：见 4.4。原则：6.x 只删"对任何现存浏览器都无效"的代码与"本来就死了"的渠道；凡是用户可见的功能/类名/API，6.x 只做文档级 deprecated + SassDoc `@deprecated` 标记。

---

## 七、需要维护者拍板的 4 个决策点

| # | 分歧 | 选项 | 建议 |
|---|---|---|---|
| 1 | browserslist 里 Chrome/Edge 取值 | 架构报告 ≥100 vs SCSS 报告 ≥110 | 两者都远好于现状（隐含 IE10）；建议 CI 跑 `npx browserslist` 看实际覆盖后取 110（2021-2022 线，更干净） |
| 2 | sass-lint 处置 | 架构报告：6.x 直接删掉 lint:sass；SCSS 报告：6.x 迁 stylelint 16 | **推荐迁 stylelint 16**（顺手补齐防回归规则）；想控制 6.x 体量则先删后补 |
| 3 | ESLint 9 时机 | JS 报告：6.x（gulp-eslint-new 零运行时风险）；架构报告：7.0 | **推荐 6.x**，同上可加禁用已废弃 jQuery API 的防回归规则 |
| 4 | ~~jQuery peer 范围~~ 已决策（2026-10-21） | — | 不为 jQuery 4 做兼容：peer 收紧为 `">=3.6.0 <4"`；~40 处机械修复不列入 6.x |

---

## 八、建议实施顺序

1. **基建先行**：修 CI（删 BrowserStack job、actions bump、Node 矩阵 +24）→ 在 Node 22/24 完整跑通 `yarn test`，锁定绿色基线
2. **正确性**：peer 收紧 `<4` + P0/P1 bug 修复（每个 bug 配回归测试；core reInit/reflow 用例此时补上）
3. **基线**：.browserslistrc 显式化 + `silenceDeprecations` + polyfill/死属性删除 → 重建 dist → **人工 review dist diff** → 更新 compatibility 文档
4. **清理**：死文件（bower/sache/meteor/nuspec/patches/webpack.config.js）+ 死依赖（browserstack-runner/gulp4-run-sequence/幻影 rimraf）+ VERSIONED_FILES 同步精简 + deploy:commit 改 master
5. **工具链**：rollup 4（diff dist）、stylelint 16、eslint 9、caret 跟进、js-yaml 4、normalize 8.0.1
6. **文档**：deprecated 标记（docs callout + SassDoc）+ CHANGELOG（单列：浏览器下限、dist CSS 字节变化、行为修复清单、移除的分发渠道与 devOnly 工具）
7. **发版演练**：deploy:prep → diff → tag → npm publish 全流程走一遍，再正式发 6.10.0

---

## 九、三份子报告的补充索引

- SCSS：`@import` 116 处迁 `@use` 是 7.0 最大工程（牵动 490 个 settings 变量作用域 + 24 处 `!global` 反写）；float grid 943 行 / prototype 1530 行 / RTL 0 处逻辑属性；`_math.scss` 括号 bug
- JS：15 条销毁路径 bug 清单见 report-js.md 第 5 节；BrowserStack patch 疑似从未生效；jQuery 4 兼容项已裁撤（2026-10-21），仅保留 peer 收紧 `<4`
- 架构：dist 跟踪 git 继续保持；`deploy:commit` 硬编码 develop 必修；VERSIONED_FILES 剔除死通道；foundation.d.ts 头部版本失真
