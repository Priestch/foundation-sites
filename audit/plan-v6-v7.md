# v6 → v7 升级总计划

- 制定日期：2026-10-21
- 基线：master（v6.9.0，f5c7d29db）；develop/Yeti 已放弃
- 依据：`audit/report-{scss,js,architecture}.md`（调研）、`audit/summary.md`（汇总）、`audit/v7-readiness.md`（7.0 评估）、`audit/docs-updates.md`（文档清单）
- 状态标记：⬜ 未开始 / 🟨 待拍板阻塞 / ✅ 已决策

---

## 0. 已锁定的决策（不再讨论）

| # | 决策 | 内容 |
|---|---|---|
| D1 ✅ | jQuery 4 | 不做兼容准备；peerDependencies 收紧 `">=3.6.0 <4"`；7.0 移除 jQuery，保留 data-attr API 与 `*.zf.*` 事件名契约 |
| D2 ✅ | 构建链 | 保持 gulp，不引入 Vite/esbuild；7.0 构建改造在 gulp 内部（至多评估就地升 gulp 5） |
| D3 ✅ | 浏览器基线 | 两段式：6.x 显式 CSS 侧基线（JS 保持 ES5）；7.0 抬到 2023-24 线并放弃 ES5 |
| D4 ✅ | 6.x 铁律 | 零公开 API 破坏；deprecate in 6.10, remove in 7.0 |
| D5 ✅ | 分支模型 | PR → master；7.0 开发拉长命分支（建议 `v7`），master 留给 6.10.x 补丁，发版时合回 |
| D6 ✅ | Node 基线 | engines `">=20"`（只约束贡献者，不影响 dist 用户）；CI 测 22/24，M0 一次性验证 mocha-headless-chrome 兼容性（2026-10-21 确认按原计划执行） |
| 🟨 | browserslist Chrome/Edge 取 100 还是 110 | 建议 CI 跑 `npx browserslist --debug` 看实际覆盖后取 **110**（阻塞批次 B） |
| 🟨 | sass-lint 处置 | 建议**迁 stylelint 16**（想控体量可先删后补）（阻塞批次 D 可选项） |

**明确不做**（任何阶段）：Vite/esbuild 迁移、jQuery 4 兼容修复、6.x 内提前迁 `@use`、6.x 删功能代码、更换构建链。

**暂缓不阻塞**（已识别、按计划时点处理即可）：README BrowserStack 残留（随 P0-1 顺带）、CHANGELOG.md 建档（M1 开始时）、CONTRIBUTING.md GitFlow 重写（M1 批次 E）、docs 支持线声明（随批次 B）。

---

## 1. 里程碑总览

```
M0 基建修复 ──→ M1 6.10.0 发布 ──→ M2 7.0 双线开发 ──→ M3 收尾与破坏性变更 ──→ M4 7.0.0 发布
 (数天)         (目标：尽早)        (A: 去jQuery ‖ B: @use)   (grid/RTL/ESM)      (建议给 M1 公告期 ≥3 个月)
                                    └──────── 6.10.x 补丁在 master 并行 ────────┘
```

| 里程碑 | 内容 | 建议时点 |
|---|---|---|
| M0 | CI/工具链修复 + 绿色基线 | 立即 |
| M1 | 6.10.0 维护版本 | 越早越好（公告期从发布日起算） |
| M2 | 7.0 双线开发（去 jQuery、@use） | 6.10.0 发布后启动，可提前做 spike |
| M3 | 破坏性收尾（grid 收敛/RTL/ESM） | 6.10 公告期 ≥3 个月后 |
| M4 | 7.0.0 | 建议 2027 H2（由维护者定） |

---

## 2. M0：基建修复与安全网（工作量：S，数天）

目标：**在 Node 22/24 上拿到全绿的 `yarn test` 基线**，之后所有改动都有对照。

- [ ] P0-1 删 BrowserStack 全套：`browserstack-runner`、`browserstack.json`、`patches/` 整目录、`test:javascript:browserstack` 相关 scripts、CI `build_latest_browserstack` job、README 徽章与致谢（README:22,64-65）
- [ ] P0-2 CI：`actions/checkout`、`actions/setup-node` v3→v4/v5；Node 矩阵加 24；apt 包适配 ubuntu-latest；`setup-node` 加 `cache: yarn`
- [ ] P0-3 验证 mocha-headless-chrome 在 Node 22/24 跑通（必要时 patch-package 兜底；失败则 CI 先 pin 22 并记录风险）
- [ ] P1 修 `gulp/tasks/deploy.js` 的 `deploy:commit`：`push origin develop` → master（或拆为本地 commit+tag、push 人工）
- [ ] P1 声明幻影依赖 `rimraf@^3`（或 4 个任务文件改 `fs.rmSync`）
- [ ] P0 锁 `sass-embedded ~1.97.0` + `gulp/tasks/sass.js` 加 `silenceDeprecations: ['import','global-builtin']`
- [ ] peerDependencies 收紧 `">=3.6.0 <4"`（一行，D1）
- [ ] （B1 可选）~50 行 Playwright 脚本跑现成 `test/javascript/index.html`，为 7.0 铺路
- [ ] **退出标准**：Node 22 与 24 上 `yarn test` 全绿；记录基线

---

## 3. M1：6.10.0 维护版本（零破坏）

原则：每个批次一个（或一组）PR，均可在 master 直接进行；CHANGELOG.md 在本阶段开始时建档并随批次累积。

### 批次 A：正确性（P0/P1 bug，每个配回归测试）
- [ ] ResponsiveMenu 销毁失效（`js/foundation.responsiveMenu.js:100-102,147`）
- [ ] Reveal×Dropdown body 命名空间互杀 + `js/foundation.reveal.js:164` off/on 错配
- [ ] `scss/util/_math.scss:103-104` `type-of()` 括号 bug
- [ ] Sticky 缺 return（:305-308, :354-357）+ transitionend 泄漏（:256）
- [ ] Equalizer / OffCanvas mediaquery 监听泄漏；AccordionMenu keydown 漏 off；Drilldown 无条件 unwrap；Reveal 全局 keydown
- [ ] Orbit destroy 不停 Timer；Interchange load 叠加 + html 模式游离节点初始化；Magellan 三连
- [ ] 补 core `registerPlugin/reInit/reflow` 测试用例（现为 pending/空壳）
- [ ] CHANGELOG 单列"行为变化"（Orbit/Interchange/Magellan 等属可感知修复）

### 批次 B：浏览器基线（🟨 待 Chrome/Edge 100 vs 110 拍板）
- [ ] `.browserslistrc` 显式化（`chrome/edge >= 100|110, firefox >= 115, firefox_esr, safari >= 15.4, ios_saf >= 15.4, samsung >= 17, not dead`）
- [ ] 删 `gulp/tasks/deploy.js` 的 `compatibility:"ie11"`（customizer 的 `"ie9"` 一并）
- [ ] 删 JS 死 polyfill：`js/foundation.core.js:248-308`、`js/foundation.util.mediaQuery.js:20-67`、`js/foundation.util.triggers.js:5-13,106,115`、`js/foundation.util.touch.js:148-151`
- [ ] 删 CSS 死属性：`scss/_global.scss:194`、`scss/xy-grid/_frame.scss:82`
- [ ] 重建 dist → **人工 review diff**（硬门禁）
- [ ] 文档同步：`docs/pages/compatibility.md` 重写、`docs/pages/sass.md` 编译器段（Ruby Sass/node-sass → Dart Sass）+ autoprefixer 建议、`docs/pages/flexbox-mode.md` 支持线

### 批次 C：清理死文件/死依赖
- [ ] 删 `bower.json`、`sache.json`、`package.js`、`meteor-README.md`、`.versions`、`package.nuspec`、根目录 `webpack.config.js`、package.json `browserify/babelify/jspm` 字段
- [ ] `gulp/config.js` VERSIONED_FILES 同步剔除 bower/meteor 三项
- [ ] 删 `gulp4-run-sequence`；逐条验证 6 条 resolutions 可否删
- [ ] js-yaml 3→4（`gulp/tasks/customizer.js` 一处 `safeLoad`→`load`）
- [ ] `scss/vendor/normalize.scss` → 8.0.1；`motion-ui` peer `"latest"`→`"^2.0.5"`；foundation-docs 钉 commit；panini/markdown 处理器钉确切版本

### 批次 D：工具链升级（产物等价）
- [ ] rollup 2→4 + `@rollup/plugin-babel`；`gulp deploy:prep` 演练 + **diff dist 验证等价**
- [ ] sass-true 6 文件 `test-module`→`describe`、`test`→`it`，锁 `~8`
- [ ] 🟨 sass-lint 处置：迁 stylelint@^16 + stylelint-scss（推荐）或直接删 `gulp-sass-lint` + `.sass-lint.yml`
- [ ] （可选）ESLint 6→9 flat config（gulp-eslint-new）
- [ ] caret 内跟进：webpack/postcss/autoprefixer/mocha

### 批次 E：公告与文档（7.0 移除项在此全部打招呼）
- [ ] deprecated 文档批次：grid.md / flex-grid.md / prototyping-utilities.md / rtl.md（删 customizer 指引）/ responsive-embed.md / visibility.md + 4 个源文件 SassDoc `@deprecated`（见 `audit/docs-updates.md` C 类）
- [ ] docs 加"7.0 将移除 jQuery"预告
- [ ] `CONTRIBUTING.md` Git Workflow 段重写（PR → master）
- [ ] 建 `CHANGELOG.md`；`js/typescript/foundation.d.ts` 版本头更新
- [ ] engines `">=20"`

### 发版
- [ ] 发版演练全流程：`deploy:prep` → 人工 diff → tag → npm publish
- [ ] **退出标准**：6.10.0 发布；公告期时钟启动

---

## 4. M2：7.0 双线开发（与 master 的 6.10.x 并行，分支 `v7`）

### 线 A：移除 jQuery（XL，关键路径）
- [ ] **Spike（先做）**：选 Toggler + Reveal 两个代表组件，验证新 DOM 层设计——Plugin 基类（注册/reflow/destroy 去 jQuery data 化）、事件系统（命名空间语义保留）、triggers（MutationObserver→新方案）
- [ ] 设计定案：公开契约冻结清单（data-attr、事件名、`Foundation.<Name>` 导出形态；`window.Foundation` 副作用去留）
- [ ] util 层迁移：motion（已核实仅用 `trigger()`，换 native CustomEvent）、what-input 不动、keyboard/touch/box/nest/timer/mediaQuery 逐个重写
- [ ] 16 组件按复杂度迁移：简单（Toggler/SmoothScroll/ResponsiveToggle）→ 中（Accordion/Tabs/Dropdown/Tooltip/Reveal/Magellan/Equalizer/Interchange）→ 复杂（OffCanvas/Drilldown/AccordionMenu/DropdownMenu/Orbit/Slider/Sticky）→ 响应式包装器最后（ResponsiveMenu/ResponsiveAccordionTabs）
- [ ] 测试迁移：Playwright 正式替换 mocha-headless-chrome（复用 M0 的 B1 试点）
- **依赖**：M1 批次 A 的行为基线 + 回归测试
- **退出标准**：全部组件无 jQuery 运行、`test:bundle` 通过、peerDeps 只剩 what-input

### 线 B：Sass `@use` 模块化（L，可与线 A 并行）
- [ ] settings 配置机制设计（`@use ... with` + `sass:meta.configuration()`，参考 Bootstrap 5.3；用户 settings 导入约定的新写法定稿并出迁移指南）
- [ ] `scss/util/` 先行（`divide()` → `math.div`；5 个已 `@use` 文件为样板）
- [ ] components/forms/typography/xy-grid 分批迁移（116 处 `@import` 清零）
- [ ] `foundation-everything()` 参数与 24 处 `!global` 反写重构
- [ ] settings 拆分（`_global/_grid/_components/...`）
- **依赖**：M1 批次 D 的 sass-true 新 API 测试；建议 M1 期间顺手扩组件 mixin 级用例
- **退出标准**：`@import` 0 处；Dart Sass 下无 deprecation 警告；settings 新旧写法迁移指南发布

---

## 5. M3：破坏性收尾（依赖 M1 公告期 ≥3 个月 + 线 A/B 完成）

- [ ] grid 收敛：删 `scss/grid/` 全部 + 54 处 `$global-flexbox` 分支 + `foundation-float` 产物 + `foundation-everything($flex)` 参数
- [ ] prototype：拆独立包（推荐）或删除
- [ ] RTL：逻辑属性重写（6.x 基线已解锁 Safari ≥14.1/Chrome ≥87 需求）+ 删 `foundation-rtl` 产物
- [ ] 浏览器基线抬到 2023-24 线（Chrome/Edge ≥120、FF ≥128、Safari/iOS ≥17）+ 放弃 ES5 dist + Babel 8 / 原生 ESM（gulp 内实现）
- [ ] 删剩余 IE hack：`.show-for-ie`、`::-ms-*` 系列、card/flex-grid IE 修复、箭头 PNG fallback
- [ ] 移除 sassy-lists/_vendor、corejs-typeahead、requirejs/AMD bundle 测试
- [ ] eslint 10、stylelint 17（若 M1 已迁 16）
- [ ] 评估：文档链替换（暂缓亦可）、dist 是否出 git、gulp 4→5
- **退出标准**：7.0.0-beta；迁移指南（jQuery 用户、Sass settings 用户、grid 用户三份）

## 6. M4：7.0.0 发布

- [ ] 发版演练（同 M1 流程）→ 7.0.0
- [ ] master 合回 `v7`；6.x 转 security-only 维护

---

## 6. 风险与硬门禁

| 风险 | 缓解 |
|---|---|
| dist 静默变化（rollup 升级、browserslist 收紧） | 每次重建 dist 后**人工 review diff**，CHANGELOG 显著声明 |
| 行为修复可感知（Orbit/Interchange/Magellan 等） | CHANGELOG 单列"行为变化"章节 |
| mocha-headless-chrome 在新 Node 失败 | M0 先验证；失败则 CI pin 22 + patch 兜底，7.0 线 A 换 Playwright |
| grid 收敛公告期不足 | M3 以 6.10.0 发布日起算 ≥3 个月为硬条件 |
| jQuery 移除半途而废 | Spike 先验证机制；组件按复杂度梯度迁移，每合入一个保持全绿 |
| 公告期开销被压缩 | 6.10.0 尽早发是唯一解——它同时是安全网、公告期、垫层 |

## 7. 工作量感知

| 阶段 | 体量 | 备注 |
|---|---|---|
| M0 | S（数天） | 全是删改配置 |
| M1 | M（2-4 周） | 5 个批次可并行推进的部分多 |
| M2 线 A | **XL** | 7.0 最大单项 |
| M2 线 B | L | 可与 A 完全并行（不同人/不同目录） |
| M3 | M-L | 多为删除，公告期是主要等待 |
