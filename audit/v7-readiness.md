# 7.0 规划评估与 6.x 前置工作清单

- 日期：2026-10-21
- 输入：用户提出的 7.0 六项规划 + audit/ 下三份审计报告
- 方法：逐项对照三份报告核实可行性、工作量与连带影响；关键事实重新 grep 源码验证

---

## 一、总体判断

**六项规划全部合理**，且与三份报告划出的 7.0 边界几乎一一对应。需要强调的唯一修正视角是：

> **6.10.0 不是"顺手维护版"，而是 7.0 的前置工程包**——它同时承担四个角色：
> 1. **安全网**：修 bug + 补测试，给 7.0 重写提供"正确行为"的唯一对照物
> 2. **公告期**：7.0 要删的每一样东西（float grid、prototype、RTL 产物、jQuery……）必须在 6.x 打过招呼
> 3. **垫层**：浏览器基线提升 + polyfill/死代码清理，直接缩小 7.0 的重写面
> 4. **生存力**：CI/工具链修复，保证 7.0（以年计的开发期）有绿基线可用

**7.0 内部风险排序**（决定推进顺序）：

| 排序 | 项 | 工作量 | 风险 | 说明 |
|---|---|---|---|---|
| 1 | 移除 jQuery | **XL** | 高 | 16 组件 + Plugin 机制 + 5 个 util 全部重写 |
| 2 | Sass 新语法（@use） | **L** | 高 | 116 处 @import、490 变量作用域、24 处 !global、用户 settings 约定全部重设计 |
| 3 | grid 收敛（三写法归一） | M | 中 | 依赖 6.10 的 deprecated 公告期 |
| 4 | 依赖升级 | M | 中 | 多数已在 6.x 完成，7.0 只剩"换代"项 |
| 5 | 浏览器基线再提升 | S-M | 低 | 大部分是配置 + 清理，6.x 已做一半 |

---

## 二、逐项评估

### 1. 移除 jQuery —— 合理，7.0 最大单项工程

**影响面**（report-js.md）：`foundation.core.plugin.js` 的注册/reflow/destroy 机制（jQuery data 驱动）、`util/triggers`（事件命名空间 + MutationObserver 懒初始化）、`keyboard/touch/box/nest/timer/mediaQuery` 五个 util、16 个组件的 DOM 操作代码，全部基于 jQuery API。

**本次新核实的事实（利好）**：
- `js/foundation.util.motion.js` 是**自实现**的 CSS 类动画（`mui-enter/leave` + transitionend），对 jQuery 的依赖只有 `elem.trigger()` —— 移除 jQuery 时换成 native CustomEvent 即可，**不需要连带 motion-ui 包决策**（框架 JS 本就不 import motion-ui，只在 Orbit 注释里提及）
- `what-input` 是 vanilla JS 库，框架只有 `js/foundation.dropdown.js:171` 读它写到 body 的 `data-whatinput` 属性 —— **不受影响**，7.0 后 peerDependencies 可只剩 what-input

**关键设计建议**：7.0 保留 data-attribute API（`data-toggle`/`data-open`/`data-close` 等）与 namespaced 事件名（`opened.zf.*`/`closed.zf.*` 等）作为公开契约，只换底层引擎。否则用户迁移成本≈换框架——这正是放弃 develop/Yeti 的理由，不能在 7.0 重演。

**对 6.x 的要求**：见前置清单 A1（行为基线）、A2（peer 收紧 `<4`——已确认不做 v4 兼容）、A3（公告 jQuery 将移除）。

### 2. Sass 用最新语法 —— 合理，7.0 第二大工程

- 迁移内容：116 处 `@import`/12 文件 → `@use`/`@forward`；490 个 settings 变量从全局作用域改为模块配置（参考 Bootstrap 5.3 的 `@use ... with` + `sass:meta.configuration()` 模式）；24 处 `!global` 反写、`foundation-everything()` 的参数开关机制、用户侧 settings 导入约定，全部要重新设计
- 用官方 `sass-migrator module` 起步，但只是半自动
- **6.x 绝不能提前迁**（破坏用户 settings 约定 = 公开 API 破坏），且必须先做：锁 `sass-embedded ~1.97` + `silenceDeprecations`（否则 6.x 自己先被 1.80+ 的 @import 告警淹没）、sass-true 测试 API 迁 `describe/it`（True 9.0 删旧 API）
- **建议的额外前置**：6.x 把 Sass 测试从现在的 34 个 util 级用例扩到组件 mixin 级——7.0 大迁移时这是唯一能兜住回归的安全网

### 3. 整理多选子系统（grid 三种写法）—— 合理

现状核实（report-scss.md 第 3 节）：float grid（`scss/grid/` 943 行）+ flex 类名网格（`$global-flexbox` 分支 54 处/11 文件）+ xy-grid（1150 行）三套并存；外加 prototype（1530 行，独立产物 167K 比主产物还大）与 RTL 独立产物（全库 0 处逻辑属性）。

- 建议收敛目标：**xy-grid 为唯一网格**；prototype 拆独立包（比直接删温和）；RTL 用逻辑属性重写后删独立构建
- 铁律：**deprecate in 6.10, remove in 7.0**——`.row/.columns` 类名、`$global-flexbox:false`、prototype mixin、RTL 产物都是公开 API，6.x 只做文档 callout + SassDoc `@deprecated`，代码删除全部留给 7.0
- 注意：grid 收敛的公告期从 6.10 发布才开始算，所以 **6.10 越早发，7.0 删得越安心**

### 4+6. 依赖升级（不必最新，按工作量评估）—— 报告正是这个结论

原则分界：**6.x 修"会坏的"，7.0 换"要换代的"**。

| | 6.x（修/摘/锁） | 7.0（换代） |
|---|---|---|
| 构建 | 删 BrowserStack 全套、phantom 死文件、rimraf 显式化、rollup 2→4、actions v3→v4/v5 | gulp 4→5 就地升级（2026-10-21 维护者确认：不换 Vite，构建链保持 gulp） |
| 转译 | Babel 7 caret 跟进（保持 ES5 dist） | Babel 8 / 放弃转译、原生 ESM |
| 测试 | 保证 mocha-headless-chrome 能跑 | Playwright 替换 |
| Lint | （可选）ESLint 9、stylelint 16 | ESLint 10、stylelint 17 |
| 编译器 | 锁 sass-embedded ~1.97 + 静音告警 | @use 化后再评估 |
| 杂项 | js-yaml 4、normalize 8.0.1、peer 钉版本 | 移除 sassy-lists/typeahead/requirejs |

一个提醒：**别在 6.x 过度投资 gulp/Babel**——去掉 jQuery、转原生 ESM 之后，构建链已确认保持 gulp（不引入 Vite），7.0 的构建改造在 gulp 内部进行，6.x 的目标只是"整个 7.0 开发期内不腐坏"。

### 5. 浏览器基线明确化并升级 —— 合理，且是 7.0 的直接前置

两段式（两份报告一致）：
- **6.x**：显式 CSS 侧基线（Chrome/Edge ≥100~110、Firefox ≥115 ESR、Safari/iOS ≥15.4、`not dead`），JS dist 维持 ES5
- **7.0**：抬到 2023-24 线（Chrome/Edge ≥120、FF ≥128、Safari/iOS ≥17）+ 放弃 ES5 dist + 原生 ESM

关键联动：**6.x 基线预解锁 7.0 要用的 API**。Safari ≥15.4 / Chrome ≥100 意味着逻辑属性（RTL 重写的前提）、ResizeObserver、native CustomEvent、`:focus-visible` 等在 7.0 都可以裸用、不写兜底。6.x 删掉的那些 polyfill（core.js 的 rAF/Function.bind/iOS6 嗅探、IE8 matchMedia、MutationObserver 前缀探测）就是 7.0 不用移植的代码——**这一项做得越早，jQuery 移除的重写面越小**。

---

## 三、6.x 前置清单（按"为什么是前置"分三级）

### A 级：不做，7.0 就不能安全开工

| # | 事项 | 为什么是前置 | 出处 |
|---|---|---|---|
| A1 | 行为基线：修 15 条 P0/P1 销毁路径 bug + 补 core `registerPlugin/reInit/reflow` 测试（现为 pending/空壳）+（建议）扩 Sass mixin 级测试 | 7.0 重写时唯一的"正确行为"对照物；现在的测试覆盖恰好在 bug 集中区是空的 | report-js §5/§6 |
| A2 | peerDependencies 收紧为 `">=3.6.0 <4"`（2026-10-21 确认：不做 jQuery 4 兼容准备） | 一行改动，防止包管理器把用户自动升到 4.x；~40 处机械修复不列入 6.x | report-js §1 |
| A3 | deprecated 公告全套：float grid、`$global-flexbox:false`、prototype、RTL 产物、`.flex-video`、`.show-for-ie`（文档 callout + SassDoc `@deprecated`）；docs 里加"7.0 将移除 jQuery"预告 | 7.0 要删的每一样都必须在 6.x 打过招呼 | report-scss checklist |
| A4 | 浏览器/Node 基线：`.browserslistrc` 显式化 + 删死 polyfill/死 CSS 属性 + 重建 dist；engines `>=20` + CI 测 22/24 | 给 7.0 预解锁 API + 缩小重写面 | report-scss §5 / report-js §2 |
| A5 | 生存力修复：CI 删 BrowserStack job、actions bump、`deploy:commit` 改 master、rimraf、死文件（bower/sache/meteor/nuspec/patches）清理、sass 锁版本 + 静音 | 保证 7.0 开发期内 CI 绿、可发版；`push origin develop` 硬编码会让 master 化后的第一次发版直接撞墙 | report-architecture §8/§10 |
| A6 | rollup 2→4 + `@rollup/plugin-babel`（deploy:prep 后 diff dist 验证） | 发版工具链在 7.0 开工前稳定；它只在发版期跑，拖到 7.0 会和所有其他变更挤在一起爆 | report-architecture §10-5 |

### B 级：强烈建议（直接降低 7.0 风险）

| # | 事项 | 理由 |
|---|---|---|
| B1 | Playwright 试点：~50 行脚本跑现有 `test/javascript/index.html` | 为 7.0 替换 mocha-headless-chrome 铺路，不动测试文件本身 |
| B2 | stylelint 16 迁移（替代死掉的 sass-lint） | 7.0 `@use` 重写期间需要能检查新语法的 lint |
| B3 | ESLint 9 flat config | 原 jQuery API 防回归规则随 jQuery 4 兼容项一并裁撤；lint 升级本身仍有价值（6.8 已 EOL） |

### C 级：6.x 明确不要做

- `@use`/`@forward` 迁移本身（破坏用户 settings 约定）
- 删除任何 grid/prototype/RTL 代码（公开 API，只公告）
- JS 原生 ESM / 放弃 ES5 dist（CDN 兼容承诺）
- 动 data-attribute API 与事件名
- 更换构建链（已确认不引入 Vite；若将来有需要，仅评估 gulp 4→5 就地升级）

---

## 四、结论与推进顺序建议

1. 六项规划全部成立；**唯一修订**是给第 1 项（移除 jQuery）补充两条设计前提：保留 data-attr API/事件名契约；motion/what-input 已核实不受牵连
2. 6.10.0 = A 级全做 + B 级选做，**尽早发布**——它同时是安全网、公告期、垫层和生存力工程
3. 7.0 推进顺序：**移除 jQuery** 与 **@use 迁移**可两条线并行（代码不相交，分别由 A1 的 JS/Sass 测试兜底）；**grid 收敛放最后**——它的 deprecated 公告期从 6.10 发布才开始算
4. 所有 A 级事项的详细操作步骤已在三份子报告的 checklist 中，可直接开工
