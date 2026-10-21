# 升级/版本相关文档更新清单

- 日期：2026-10-21（已逐一在仓库内核实，标注了报告外的新发现）
- 范围：浏览器支持声明、分支流程、deprecated 公告、安装分发、变更记录
- 用法：A/B 类随 6.x 对应代码改动同 PR 提交；C 类可凑一个"deprecated 公告"纯文档 PR；其余按标注时机执行

---

## A. 浏览器支持声明（`.browserslistrc` 收紧的文档面，6.x 同步改）

| # | 文件 | 现状（已核实） | 应更新为 |
|---|---|---|---|
| 1 | `docs/pages/compatibility.md` | 整页过时：front-matter "works back as far as IE9 and Android 2"；表格含 IE 9+ / Android 4.4+ / IE Mobile / "Last Two Versions"；"What Won't Work" 还在讲 IE8 | 按新基线整页重写（Chrome/Edge ≥100~110、Firefox ≥115 ESR、Safari/iOS ≥15.4、not dead）；"What Won't Work" 段改写或删除 |
| 2 | `docs/pages/sass.md:20-36` | ⚠️ 报告外新发现：编译器段仍写 "**Ruby Sass 3.4+ / node-sass 3.4.2+ (libsass)**"（项目实际早已用 sass-embedded/Dart Sass）；autoprefixer 建议 `['last 2 versions','ie >= 9','android >= 4.4','ios >= 7']` | 编译器段重写为 Dart Sass（sass-embedded）；autoprefixer 配置换新基线；补 Dart Sass 1.80+ @import deprecation 说明 |
| 3 | `docs/pages/flexbox-mode.md:18-22` | "The latest Chrome and Firefox / Safari 6+ / IE/Edge 10+ / iOS 7+ / Android 4.4+" | 新基线；同时加 float grid / `$global-flexbox:false` 的 deprecated callout（7.0 移除） |
| 4 | `README.md` | ⚠️ 报告外新发现：BrowserStack 徽章（:22，注释态）+ BrowserStack Open-Source Program 致谢（:64-65） | 摘除 BrowserStack 全套（依赖+CI）时一并清理；顺带评估注释掉的 ZURB training 段（:69）去留 |

## B. 分支/贡献流程（master 化维护的直接冲突面）

| # | 文件 | 现状（已核实） | 应更新为 |
|---|---|---|---|
| 5 | `CONTRIBUTING.md:58-82` | ⚠️ 报告外新发现：整个 Git Workflow 段描述 GitFlow——"most often `develop`"、`develop-v...`/`master-v...` 分支族、"master = stable only" | 重写该段：维护直接在 `master` 进行，PR → `master`；分支命名规范（`type/description-issue`）保留 |
| 6 | `CLAUDE.md`（项目根） | "PRs target `develop`, never `master`" | ✅ 本次已更新（见下文） |

## C. deprecated 公告（7.0 移除项的文档面，6.x 纯文档 PR）

| # | 文件 | 动作 |
|---|---|---|
| 7 | `docs/pages/grid.md`、`docs/pages/flex-grid.md` | float grid 与 `$global-flexbox:false` 加 deprecated callout（7.0 移除；迁移指引指向 xy-grid） |
| 8 | `docs/pages/prototyping-utilities.md` | 加 7.0 移除/拆独立包预告 |
| 9 | `docs/pages/rtl.md:32` | 已核实仍在指引**已下线的 customizer**（"select Right-to-left under the Text Direction section of the customizer"）→ 改为 Sass 变量构建说明；可加"RTL 产物 7.0 逻辑属性重写"预告 |
| 10 | `docs/pages/responsive-embed.md` | `.flex-video` deprecated（别名类 7.0 删） |
| 11 | `docs/pages/visibility.md` | `.show-for-ie` / `.hide-for-ie` deprecated |
| 12 | 源文件 SassDoc | 与 #7-#11 同批：`scss/grid/_grid.scss`、`scss/grid/_flex-grid.scss`、`scss/components/_flex-video.scss`、`scss/components/_visibility.scss` 文件头 `@deprecated` 标记（callout 模板参考现成的 `typography-base.md` / `flexbox-utilities.md`） |

## D. 安装/分发文档

| # | 文件 | 现状 | 动作 |
|---|---|---|---|
| 13 | `docs/pages/installation.md` | ✅ 已核实干净：无 Bower/Meteor/NuGet 字样，仅 jsDelivr CDN（版本号由 `deploy:version` 经 VERSIONED_FILES 自动替换） | 6.x 无需动 |
| 14 | `js/typescript/foundation.d.ts` | 头部 "Type definitions for Foundation Sites **v6.3.1**"，且随 dist 发布 | 更新到当前版本；建议纳入发版前检查清单（6.x） |
| 15 | `scss/foundation.scss:2` | "Version 6.9.0" | 正常——发版时 VERSIONED_FILES 机制更新，无需单独动作 |

## E. 变更记录

| # | 文件 | 现状 | 动作 |
|---|---|---|---|
| 16 | `CHANGELOG.md` | ⚠️ 报告外新发现：**文件不存在**（历版变更走 GitHub Releases） | 建议 6.10.0 起建 CHANGELOG.md（Keep a Changelog 格式）。首版必须声明：浏览器下限提升、dist CSS 字节变化、peer 收紧 `<4`、销毁路径行为修复（Orbit/Interchange/Magellan 等属行为变化）、移除的分发渠道与 devOnly 工具、Node 基线 |

---

## 优先级映射

- **随对应代码改动同 PR（6.x）**：#1 #2 #3（browserslist 收紧）、#5（PR 目标改 master，应与 `deploy:commit` 修复同批）
- **6.x 纯文档 PR（deprecated 公告批次）**：#7-#12 + #6（CLAUDE.md 已完成）
- **摘 BrowserStack 时顺带**：#4
- **发版期**：#16 建档 + #14 版本头；#13/#15 自动处理
