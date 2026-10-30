# 线 A 收尾报告（FINAL · 2026-10-30 定稿）

> 本文替代 2026-10-23 的 S14/S15 过程稿。jQuery 已于 2026-10-29 从库中完全移除（方案 B），
> 2026-10-30 文档站三轮活测修复后合入 `dev-v7`（merge `df5e939da`）。行为差异全集见
> **`audit/7.0-behavior-ledger.md`**（CHANGELOG 底稿）；Sass 侧见 `audit/line-b-settings-migration.md`。

## 一、终态

| 门禁 | 结果 |
|---|---|
| `js/` jQuery import | **0**（S15 时点 27 → S16 归零） |
| peerDependencies | 仅 `what-input`（jQuery 留 devDeps 供差分测试仪器） |
| dist | 0 处 `require('jquery')`（余下全 jsdoc 注释）；CSS 三变体逐字节等价 |
| 测试 | 89 sass + 745 JS + 1 bundle 全绿；`gulp lint` 0 错 |
| 文档站 | 零 jQuery 运行（docs.js 先于 docs-chrome.js 加载），14 组件页交互级验证 + load 前窗口 + 铬件功能 |

## 二、公共 API 终形（方案 B，用户裁决 2026-10-29）

- **`Foundation.init(root?)`**：元素 | document | 选择器串，默认全文档。做 `.no-js` 移除、`MediaQuery._init`、reflow。替代 `$(document).foundation()`。
- **`Foundation.Registry`**：公共实例查询面（`getInstance(el)`），替代 `$(el).foundation('method')` 派发。**双 bundle 各持 Registry**——foundation.js 与 foundation-next.js 的实例互查必须用各自的表。
- `reflow/reInit/registerPlugin/unregisterPlugin` 全原生（reflow=子树+根自身扫描、data-options 解析保留、registerPlugin 真事件白吸）。

## 三、切片史（S1–S16 + 三轮活测）

| 阶段 | 内容 |
|---|---|
| S1–S6 | registry/events/dom 骨架 + 双列差分（27×2）；core/Plugin 存储换 Registry；Triggers 迁移+dispatchLocal 双运输；Motion/Keyboard 混合态；Reveal（最难样本，fx 定原生） |
| S7–S13 | SmoothScroll/ResponsiveToggle/Magellan；Accordion/Tabs/Tooltip/Equalizer；菜单组；utils 残余；fx 方案 A 引擎（用户裁决保折叠动画） |
| S14–S15 | deepMerge/fetch 化；Playwright runner 迁移；首个纵切（Toggler+Motion） |
| S16 | 27 套件原生化 + 终形（25 文件）；codemod 六类错位清单见仓库记忆，供后续 codemod 复用 |
| 方案 B | init API/Registry 公开/dist 重建（BREAKING CHANGE 随提交） |
| 活测 I | 文档站零 jQuery 化（gulp 双流拆分、layout 补 script、docs.js 重写）；揪出 tooltip 残留 `$`、dom entry 缺 `deepMerge`、slider `$fill` 崩溃 |
| 活测 II | **Triggers 武装 load→DOMContentLoaded**（挂起 iframe 拖死全部 data-* 交互的用户报告驱动）+ entry `$` 崩溃 + abide/responsiveAccordionTabs/drilldown 的 lint 阻塞 bug |
| 活测 III | **toElement(window)→frames[0]** 跨域 SecurityError 根因；**8×toggle 风暴**（externals 漏 triggers → 8 份私有副本；补 externals + `window.zfTriggersArmed` 互斥）；Magellan 双根因（load 门槛 + 晚注入导航）；kitchen-sink 演示缺目标区块（文档缺陷） |

## 四、方法论沉淀（跨项目可复用）

1. **双列差分**：同一行为规格跑 jQuery 适配器列（golden master）+ 原生列，等价性以测试钉死而非口头发誓。
2. **缝必须双侧同一提交翻转**，否则双发/漏发。
3. **宿主对象皆"类数组"**：`window[i]`=frame、`select[i]`=option——集合拆包启发式必须 nodeType/window 双守卫。
4. **"等价≠可用"**：与 6.x 相同的缺陷窗口（如 load 前不可交互）在真实网络环境（资源挂起）下会放大成"完全不可用"，等价替换裁决前先问用户环境。
5. **重复投递指纹**："open 型正常 + toggle 型死亡" = N 次重复投递净偶数翻转；探针日志数重复次数直接定位多副本。
6. **探针纪律**：原生 `addEventListener` 不解析点号命名空间（Events 层派发的是裸 type + 虚拟 namespace 属性）；探错元素/臆造类名都会制造假阴性——每个"失败"先验证仪器。
7. **改动 gulp config 必须重启 watch**（旧进程持旧 externals 映射）。

## 五、遗留（按优先级）

1. 结构性耦合组件的 mixin 参数化（button-group/menu 族），之后 5 个 legacy 组件可入机制（B8 条目）
2. `@use` 世界 `@extend` 选择器序统一 + dist 入口切模块流 + sourcemap 重生成（与 if()→math.if、sass-embedded 解锁捆成 7.0 重定基线一批）
3. `$global-flexbox` 分支全量移除（float 已删，分支永真，属清理）
4. 每 bug 一回归测试的补齐（活测轮发现的 C 类修复多数已有钉，核对缺口）
5. 6.10.0 真发版（master 线）
