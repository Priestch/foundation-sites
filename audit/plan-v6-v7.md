# v6 → v7 升级总计划

- 制定日期：2026-10-21
- 基线：master（v6.9.0，f5c7d29db）；develop/Yeti 已放弃
- 依据：`audit/report-{scss,js,architecture}.md`（调研）、`audit/summary.md`（汇总）、`audit/v7-readiness.md`（7.0 评估）、`audit/docs-updates.md`（文档清单）
- 状态标记：⬜ 未开始 / 🟨 待拍板阻塞 / 🔄 进行中 / ✅ 已决策（任务清单用 `[x]`/`[ ]`）
- **进度快照（2026-10-22 晚修订）**：M0 ✅ 完成；M1 ✅ 代码 + 发版演练完成，6.10.0 **尚未发布**（全部提交在 `dev-v7`，master 仍在 v6.9.0）；M2 线 A 🔄 S1 骨架实施中（独立 worktree，追加双列差分测试），线 B 🔄 B1 `divide()` 分流实施中（独立 worktree）；M3/M4 ⬜。本日依线 A/B 探索结论修订：@import 口径、settings 配置路线、Spike 拍板项

---

## 0. 已锁定的决策（不再讨论）

| # | 决策 | 内容 |
|---|---|---|
| D1 ✅ | jQuery 4 | 不做兼容准备；peerDependencies 收紧 `">=3.6.0 <4"`；7.0 移除 jQuery，保留 data-attr API 与 `*.zf.*` 事件名契约 |
| D2 ✅ | 构建链 | 保持 gulp，不引入 Vite/esbuild；7.0 构建改造在 gulp 内部（至多评估就地升 gulp 5） |
| D3 ✅ | 浏览器基线 | 两段式：6.x 显式 CSS 侧基线（JS 保持 ES5）；7.0 抬到 2023-24 线并放弃 ES5 |
| D4 ✅ | 6.x 铁律 | 零公开 API 破坏；deprecate in 6.10, remove in 7.0 |
| D5 ✅ | 分支模型 | ~~PR → master~~ **2026-10-22 修订：PR → `dev`（集成分支），发版 `dev` → `master` 打 tag；`develop`（Yeti 遗留）封存不复用；7.0 长命分支 `dev-v7`。不复活 develop-v\*/master-v\* 分支族** |
| D6 ✅ | Node 基线 | engines `">=20"`（只约束贡献者，不影响 dist 用户）；CI 测 22/24，M0 一次性验证 mocha-headless-chrome 兼容性（2026-10-21 确认按原计划执行） |
| D7 ✅ | browserslist 6.x 基线 | 已定 **Chrome/Edge 110**：`.browserslistrc` 显式基线 `chrome/edge >= 110, firefox >= 115, safari/ios_saf >= 15.4, samsung >= 17, not dead`（批次 B 已落地，5cc95f6ce；JS dist 保持 ES5，66caf3b18） |
| D8 ✅ | sass-lint 处置 | 已定 **迁 stylelint 16**（批次 D 已落地，387ed3850） |

**明确不做**（任何阶段）：Vite/esbuild 迁移、jQuery 4 兼容修复、6.x 内提前迁 `@use`、6.x 删功能代码、更换构建链。

**暂缓不阻塞**（已识别、按计划时点处理即可）：README BrowserStack 残留（随 P0-1 顺带）、CHANGELOG.md 建档（M1 开始时）、CONTRIBUTING.md GitFlow 重写（M1 批次 E）、docs 支持线声明（随批次 B）。

---

## 1. 里程碑总览

```
M0 基建修复 ──→ M1 6.10.0 发布 ──→ M2 7.0 双线开发 ──→ M3 收尾与破坏性变更 ──→ M4 7.0.0 发布
 (数天)         (目标：尽早)        (A: 去jQuery ‖ B: @use)   (grid/RTL/ESM)      (建议给 M1 公告期 ≥3 个月)
                                    └──────── 6.10.x 补丁在 master 并行 ────────┘
```

| 里程碑 | 内容 | 建议时点 | 状态 |
|---|---|---|---|
| M0 | CI/工具链修复 + 绿色基线 | 立即 | ✅ 完成 |
| M1 | 6.10.0 维护版本 | 越早越好（公告期从发布日起算） | ✅ 代码+演练完成，**待发布** |
| M2 | 7.0 双线开发（去 jQuery、@use） | 6.10.0 发布后启动，可提前做 spike | 🔄 线 A Spike 首步进行中 |
| M3 | 破坏性收尾（grid 收敛/RTL/ESM） | 6.10 公告期 ≥3 个月后 | ⬜ |
| M4 | 7.0.0 | 建议 2027 H2（由维护者定） | ⬜ |

---

## 2. M0：基建修复与安全网（工作量：S，数天）✅

目标：**在 Node 22/24 上拿到全绿的 `yarn test` 基线**，之后所有改动都有对照。

- [x] P0-1 删 BrowserStack 全套：`browserstack-runner`、`browserstack.json`、`patches/` 整目录、`test:javascript:browserstack` 相关 scripts、CI `build_latest_browserstack` job、README 徽章与致谢（README:22,64-65）（7d21ec6b4、50edc1651）
- [x] P0-2 CI：`actions/checkout`、`actions/setup-node` v3→v4/v5；Node 矩阵加 24；apt 包适配 ubuntu-latest；`setup-node` 加 `cache: yarn`（50edc1651）
- [x] P0-3 验证 mocha-headless-chrome 在 Node 22/24 跑通（必要时 patch-package 兜底；失败则 CI 先 pin 22 并记录风险）
- [x] P1 修 `gulp/tasks/deploy.js` 的 `deploy:commit`：`push origin develop` → master（或拆为本地 commit+tag、push 人工）
- [x] P1 声明幻影依赖 `rimraf@^3`（或 4 个任务文件改 `fs.rmSync`）（e73c8dab9）
- [x] P0 锁 `sass-embedded ~1.97.0` + `gulp/tasks/sass.js` 加 `silenceDeprecations: ['import','global-builtin']`（e73c8dab9）
- [x] peerDependencies 收紧 `">=3.6.0 <4"`（一行，D1）（e73c8dab9）
- [ ] （B1 可选）~50 行 Playwright 脚本跑现成 `test/javascript/index.html`，为 7.0 铺路 —— 未做，并入 M2 线 A 测试迁移
- [x] **退出标准**：Node 22 与 24 上 `yarn test` 全绿；记录基线

---

## 3. M1：6.10.0 维护版本（零破坏）✅ 代码+演练完成，待发布

原则：每个批次一个（或一组）PR，均可在 master 直接进行；CHANGELOG.md 在本阶段开始时建档并随批次累积。
实际执行记录：全部批次提交于 `dev-v7`（2026-10-22 时 master 仍为 v6.9.0；按 D5 发布时 `dev` → `master` 打 tag）。

### 批次 A：正确性（P0/P1 bug，每个配回归测试）✅（f514ef0e1）
- [x] ResponsiveMenu 销毁失效（`js/foundation.responsiveMenu.js:100-102,147`）
- [x] Reveal×Dropdown body 命名空间互杀 + `js/foundation.reveal.js:164` off/on 错配
- [x] `scss/util/_math.scss:103-104` `type-of()` 括号 bug
- [x] Sticky 缺 return（:305-308, :354-357）+ transitionend 泄漏（:256）
- [x] Equalizer / OffCanvas mediaquery 监听泄漏；AccordionMenu keydown 漏 off；Drilldown 无条件 unwrap；Reveal 全局 keydown
- [x] Orbit destroy 不停 Timer；Interchange load 叠加 + html 模式游离节点初始化；Magellan 三连
- [x] 补 core `registerPlugin/reInit/reflow` 测试用例（现为 pending/空壳）
- [x] CHANGELOG 单列"行为变化"（Orbit/Interchange/Magellan 等属可感知修复）

### 批次 B：浏览器基线（✅ 已拍板 Chrome/Edge 110，已完成：5cc95f6ce → f0b15664b）
- [x] `.browserslistrc` 显式化（`chrome/edge >= 110, firefox >= 115, safari >= 15.4, ios_saf >= 15.4, samsung >= 17, not dead`；firefox_esr 由 `not dead` 覆盖）（5cc95f6ce）
- [x] 删 `gulp/tasks/deploy.js` 的 `compatibility:"ie11"`（customizer 的 `"ie9"` 一并）（f8c37318b）
- [x] 删 JS 死 polyfill：`js/foundation.core.js:248-308`、`js/foundation.util.mediaQuery.js:20-67`、`js/foundation.util.triggers.js:5-13,106,115`、`js/foundation.util.touch.js:148-151`（b65418ea5、a738c7780、7d74b7786、23c9b234f）
- [x] 删 CSS 死属性：`scss/_global.scss:194`、`scss/xy-grid/_frame.scss:82`（65cb68e30）
- [x] 重建 dist → **人工 review diff**（硬门禁）（66caf3b18）
- [x] 文档同步：`docs/pages/compatibility.md` 重写、`docs/pages/sass.md` 编译器段（Ruby Sass/node-sass → Dart Sass）+ autoprefixer 建议、`docs/pages/flexbox-mode.md` 支持线（f0b15664b）

### 批次 C：清理死文件/死依赖 ✅（8c104143b、6819b1532、c0299304b、bab219c87 等）
- [x] 删 `bower.json`、`sache.json`、`package.js`、`meteor-README.md`、`.versions`、`package.nuspec`、根目录 `webpack.config.js`、package.json `browserify/babelify/jspm` 字段（7d21ec6b4、8c104143b）
- [x] `gulp/config.js` VERSIONED_FILES 同步剔除 bower/meteor 三项
- [x] 删 `gulp4-run-sequence`；逐条验证 6 条 resolutions 可否删
- [x] js-yaml 3→4（`gulp/tasks/customizer.js` 一处 `safeLoad`→`load`）（6819b1532）
- [x] `scss/vendor/normalize.scss` → 8.0.1；`motion-ui` peer `"latest"`→`"^2.0.5"`；foundation-docs 钉 commit；panini/markdown 处理器钉确切版本（c0299304b、bab219c87）

### 批次 D：工具链升级（产物等价）✅（7245df8ef、387ed3850、b681dc694）
- [x] rollup 2→4 + `@rollup/plugin-babel`；`gulp deploy:prep` 演练 + **diff dist 验证等价**（b681dc694）
- [x] sass-true 6 文件 `test-module`→`describe`、`test`→`it`，锁 `~8`（7245df8ef）
- [x] ~~🟨 sass-lint 处置~~ → 迁 stylelint@^16 + stylelint-scss（387ed3850，D8）
- [ ] （可选）ESLint 6→9 flat config（gulp-eslint-new）—— 未做，留给 M3 评估
- [ ] caret 内跟进：webpack/postcss/autoprefixer/mocha —— 未单独验证（bab219c87 钉浮版本时或已覆盖部分）

### 批次 E：公告与文档（7.0 移除项在此全部打招呼）✅（3908663b4、d3a1c6aab、16f468faa）
- [x] deprecated 文档批次：grid.md / flex-grid.md / prototyping-utilities.md / rtl.md（删 customizer 指引）/ responsive-embed.md / visibility.md + 4 个源文件 SassDoc `@deprecated`（见 `audit/docs-updates.md` C 类）（3908663b4）
- [x] docs 加"7.0 将移除 jQuery"预告（3908663b4，docs/pages/javascript.md）
- [x] `CONTRIBUTING.md` Git Workflow 段重写（3908663b4、d3a1c6aab；2026-10-22 D5 修订后指向 `dev`，16f468faa 命名 `dev-v7`）
- [x] 建 `CHANGELOG.md`；`js/typescript/foundation.d.ts` 版本头更新（3908663b4）
- [x] engines `">=20"`

### 发版（演练 ✅，发布 ⬜）
- [x] 发版演练全流程：`deploy:prep` → 人工 diff → tag → npm publish（演练通过，未实际 publish）
- [x] **退出标准**（2026-11-02 修订）：**6.10.0 不由本方发布**——发版需维护者
  协调（npm 权限/公告期），实际发行动作归维护者；代码与发版演练产物就绪待用
  （`chore/6.10-maintenance` 分支，25 提交，deploy:prep 全链路演练通过）。
  **裁决：跳过等待，直接推进 7.0**（dev-v7 主线）。若维护者后续决定发布 6.10.0，
  重跑既有演练即可，与 7.0 工作零冲突。

---

## 4. M2：7.0 双线开发（与 master 的 6.10.x 并行，分支 `dev-v7`）

### 线 A：移除 jQuery（XL，关键路径）✅ 完成（2026-10-29，分支 `dev-v7-remove-jquery`，S1–S16 切片制推进）
- [x] **Spike**：Toggler + Reveal 验证新 DOM 层——Registry（WeakMap 点查）、ns-aware Events 层、Triggers 去 MutationObserver（S1–S6）
- [x] 设计定案：公开契约冻结（data-attr、`*.zf.*` 事件名、`Foundation.<Name>` 导出、`window.Foundation` 保留）；8 项语义项裁决（等价替换优先，2026-10-22）；fx 折叠动画保留（方案 A，Motion 原生 fx 引擎）
- [x] util 层迁移：motion/keyboard/touch/box/nest/timer/mediaQuery/triggers/imageLoader/core.utils 全部 jQuery-free
- [x] 组件迁移：20 组件 + 8 utils 全部终形（内部原生 + 事件尾参元素化 + 同文件测试同步）；混合态缝治理（白吸机制、dispatchLocal 双运输→原生单边、triggerHandler=真非冒泡事件）
- [x] 测试迁移：Playwright 为默认 runner（S15）；测试套件全量原生化（745 passing）
- [x] **方案 B（用户裁决 2026-10-29）**：`Foundation.init(root?)` 替代 `$(document).foundation()`；`Foundation.Registry` 公共查询面；`addToJquery` 删除
- **依赖**：M1 批次 A 的行为基线 + 回归测试 ✅
- **退出标准** ✅：js/ 无 jQuery import、`test:bundle` 通过、peerDeps 只剩 what-input、dist 重建后 0 处 jQuery require、全量测试绿

### 线 B：Sass `@use` 模块化（L，可与线 A 并行）⬜
- [ ] settings 配置机制设计（2026-10-22 修订：推荐**用户 settings 文件模块化 + `sass:meta.module-variables()` 反射 + 配置 map**（`meta.load-css(..., $with:)`）——`@use ... with` 不适合：聚合层需 ~490 行逐变量 `@forward` 转配，且不可变原则与 off-canvas z-index 递增冲突。更正："参考 Bootstrap 5.3"不成立——Bootstrap 5.3 实际**未迁** `@use`（入口至今 `@import`，完整迁移排其 v6），可借鉴的仅"配置用 map 而非散变量"的思路；Foundation 7.0 因 Dart Sass 2.0 删 `@import` 无再拖一个大版本的余地。用户 settings 导入约定的新写法定稿并出迁移指南）
- [ ] `scss/util/` 先行（`divide()` 内部分流：同单位走 `math.div`、跨单位保留换算表——27 处调用、跨单位除法非 drop-in，**调用点零改动**。更正：原记"5 个已 `@use` 文件为样板"不成立——那 5 处全是 sass 内建模块 `@use`（`sass:color`/`sass:math`，其中仅 3 个在 util/），不能作为项目文件模块化样板）
- [ ] components/forms/typography/xy-grid 分批迁移（116 处 `@import` 清零）
- [ ] `foundation-everything()` 参数与 24 处 `!global` 反写重构
- [ ] settings 拆分（`_global/_grid/_components/...`）
- **依赖**：M1 批次 D 的 sass-true 新 API 测试 ✅；test/sass 当前 **0 处 settings 覆盖用例**（全部套件只依赖 partial 自带 `!default`）——B1 先补覆盖测试作为后续改造的回归网；`!global` 24 处已精确定位（color 10 / off-canvas 5 / foundation 2 / mixins 3 / breakpoint 2 / grid 2）
- **退出标准**：`@import` 0 处（2026-10-22 修订为全仓 **158** 处口径 = scss/ 116 + assets/ 4 + test/sass/ 22 + docs/assets 16；`@forward` 现状 0 处）；Dart Sass 下无 deprecation 警告；settings 新旧写法迁移指南发布

---

## 5. M3：破坏性收尾（依赖 M1 公告期 ≥3 个月 + 线 A/B 完成）⬜
（公告期时钟从 6.10.0 实际发布日起算——当前发版是 M3 的唯一前置等待）

- [ ] grid 收敛：删 `scss/grid/` 全部 + 54 处 `$global-flexbox` 分支 + `foundation-float` 产物 + `foundation-everything($flex)` 参数
- [ ] prototype：拆独立包（推荐）或删除
- [ ] RTL：逻辑属性重写（6.x 基线已解锁 Safari ≥14.1/Chrome ≥87 需求）+ 删 `foundation-rtl` 产物
- [ ] 浏览器基线抬到 2023-24 线（Chrome/Edge ≥120、FF ≥128、Safari/iOS ≥17）+ 放弃 ES5 dist + Babel 8 / 原生 ESM（gulp 内实现）
- [ ] 删剩余 IE hack：`.show-for-ie`、`::-ms-*` 系列、card/flex-grid IE 修复、箭头 PNG fallback
- [ ] 移除 sassy-lists/_vendor、corejs-typeahead、requirejs/AMD bundle 测试
- [ ] eslint 10、stylelint 17（M1 已迁 16；M1 的 ESLint 9 可选项未做则此处直接 6→10 一并处理）
- [ ] 评估：文档链替换（暂缓亦可）、dist 是否出 git、gulp 4→5
- **退出标准**：7.0.0-beta；迁移指南（jQuery 用户、Sass settings 用户、grid 用户三份）

## 6. M4：7.0.0 发布 ⬜

- [ ] 发版演练（同 M1 流程）→ 7.0.0
- [ ] master 合回 `dev-v7`；6.x 转 security-only 维护

---

## 7. 风险与硬门禁

| 风险 | 缓解 |
|---|---|
| dist 静默变化（rollup 升级、browserslist 收紧） | 每次重建 dist 后**人工 review diff**，CHANGELOG 显著声明 |
| 行为修复可感知（Orbit/Interchange/Magellan 等） | CHANGELOG 单列"行为变化"章节 |
| mocha-headless-chrome 在新 Node 失败 | M0 先验证；失败则 CI pin 22 + patch 兜底，7.0 线 A 换 Playwright |
| grid 收敛公告期不足 | M3 以 6.10.0 发布日起算 ≥3 个月为硬条件 |
| jQuery 移除半途而废 | Spike 先验证机制；组件按复杂度梯度迁移，每合入一个保持全绿 |
| 公告期开销被压缩 | 6.10.0 尽早发是唯一解——它同时是安全网、公告期、垫层 |

## 8. 工作量感知

| 阶段 | 体量 | 备注 |
|---|---|---|
| M0 | S（数天） | 全是删改配置 ✅ |
| M1 | M（2-4 周） | 5 个批次可并行推进的部分多 ✅ |
| M2 线 A | **XL** | 7.0 最大单项 🔄 |
| M2 线 B | L | 可与 A 完全并行（不同人/不同目录） |
| M3 | M-L | 多为删除，公告期是主要等待 |
