# 线 B · settings 配置机制迁移指南（FINAL）

状态：**定稿**（线 B 终点切片 B10，2026-10-23；取代 `line-b-settings-migration-draft.md`，
草稿的机制描述与双轨证据沿用，未知键校验、B9 语义调整、三类豁免清单在此补齐定稿）。
机制代码：`scss/foundation-next.scss`（入口）+ `scss/next/`（逐组件 load unit）。
契约回归网：`test/sass/_settings_override.scss`（B1，旧路径）、`test/sass/_settings_module.scss`
（B2 起，新机制）、`test/sass/_settings_module_user*.scss`（用户 settings 模块样例）。

## 机制一句话

用户把现有 `_settings.scss` 改成一个**settings 模块**（顶层变量赋值）；入口样式用
`sass:meta` 的 `meta.module-variables()` 把它反射成一个 map；`foundation-next` 里每个
组件 mixin 通过 `meta.load-css(..., $with: ...)` 按配置加载该组件。库默认值来自以
`@use` 加载的 `scss/settings/_settings.scss`（`meta.module-variables()` 反射），
用户 map 合并其上；5 个调色板派生色（`$primary-color` 等）在配置期由生效的
`$foundation-palette` 预计算，用户直接赋值的 `*-color` 再合并一次、优先生效
（与 `test/sass/_settings_override.scss` 钉住的契约一致）。

为什么不是 `@use ... with`：聚合层需要 ~490 行 `@forward`，且 `!default` 不可变原则
与 off-canvas z-index 的运行期反写冲突。该路线已否决，不再展开。

## 用户迁移三步

以 button 为例（table 同理，mixin 换成 `foundation-table`）。

### 第 1 步：把 settings 文件改成模块

现有用法（旧路径，`_settings.scss` 整份拷贝改值）：

```scss
// main.scss（旧）
@import 'settings/settings';
@import 'foundation';          // 或 @include foundation-everything;
```

新写法——settings 只留**你真正改过的变量**，不用再整份拷贝：

```scss
// _my-settings.scss（新，用户自己的 settings 模块）
// settings 里还会调用 rem-calc() 等函数的，先保留这行 @import（见"限制"）：
@import 'util/util';

$global-radius: 8px;
$foundation-palette: (
  "primary": #1240ab,
  "secondary": #767676,
  "success": #3adb76,
  "warning": #ffae00,
  "alert": #cc4b37,
);
$button-padding: 2rem 3rem;
```

注意：

- **不再调用 `@include add-foundation-colors;`**。5 个 `*-color` 由机制在配置期从
  `$foundation-palette` 派生；想单独覆盖某个色，直接赋值即可（`$primary-color: #123456;`），
  直接赋值优先于调色板派生。
- 模块里**只放 settings 变量**。反射会把模块顶层所有变量都交给机制；私有辅助变量
  （`$-foo` / `$_foo` 开头）不会被反射，可放心留在模块里。
- 旧文件里**没改过的变量全部删掉**——库默认值由机制合并，这是新路线的主要收益。

### 第 2 步：入口改用 `foundation-next` 并反射 settings 模块

```scss
// main.scss（新）
@use "sass:meta";
@use "foundation-next" as fs;
@use "my-settings" as prefs;

@include fs.foundation-button(meta.module-variables("prefs"));
@include fs.foundation-table(meta.module-variables("prefs"));
```

每个要的组件一行；不传参（`fs.foundation-button`）即纯库默认值。

未知键校验已实现（B6 落地，`unknown-settings-keys()` + `merge-settings()` @warn）：
settings 模块里的笔误（如 `$gobal-radius`）**不会静默**——编译期逐键 @warn 提示
"不是 Foundation settings 键、不会被任何 load unit 读取"，但**不阻断编译**（合并照常，
键原样透传）。需要静默校验可用 `fs.unknown-settings-keys($map)` 自查，返回未知键列表。

### 第 3 步：核对覆盖点语义（新旧对照）

| 场景 | 旧路径行为 | 新机制行为 |
|---|---|---|
| 改 `$global-radius` | settings 里赋值，`_global.scss` 的 `!default` 接住，`$button-radius: $global-radius !default` 跟随 | 同左（load unit 只注入用户实际设置的键，`!default` 链在 unit 内照常派生） |
| 改 `$foundation-palette` | settings 里赋值 + `add-foundation-colors()` 反写 5 色 | user map 合并生效；5 色在配置期从**生效后的调色板**派生 |
| 直接赋 `$primary-color`（导入后第二覆盖点） | 必须写在 settings 的 `add-foundation-colors` 之后、且在 `_global` 再次反写前才不丢（B1 用例的写法：`@import 'global'` 之后） | 模块里直接赋值即可，机制保证其优先于调色板派生 |
| 直接赋 `$primary-color`（**导入前**第一覆盖点） | 6.x：被 palette 派生覆盖（`add-foundation-colors()` 无条件 `!global` 反写）——见"已知语义差异"第 1 条 | 模块里直接赋值即可，机制保证其优先于调色板派生 |
| 改 `$button-*` 等组件变量 | settings 里赋值，组件 partial 的 `!default` 接住 | 同左 |
| 部分编译（只要 button/table） | 手工 `@import` 对应 partial（顺序易错） | 一行 mixin，依赖由 load unit 固定 |

## 已知语义差异（迁移时必须核对）

1. **`*-color` 的"导入前赋值"优先级翻转（B9 有意调整，已落地）**。旧路径上，
   `@import 'foundation'` **之前**直接赋 `$primary-color` 会被调色板派生覆盖
   （`add-foundation-colors()` 无条件反写）；B9 把 `_global.scss` 的派生改成
   `scss/_global-module.scss` 里的 `!default` 派生单元后，**导入前的直接赋值现在胜出**
   （赋值先绑定 cell，派生只是 `!default`）。**固定的第二覆盖点契约不变**：`@import 'global'`
   之后的赋值照旧胜出（`test/sass/_settings_override.scss` 原样钉住）。新机制（settings
   模块）两个位置语义一致：直接赋值一律优先于派生。升级时凡依赖"导入前赋值被 palette
   覆盖"这一旧行为的代码需要改为改 `$foundation-palette`。
2. **`foundation-everything()` 不再写 `!global`**（B9）：`$global-flexbox: true !global`
   / `$xy-grid: true !global` 两个反写移除。生效的 flexbox 模式改由 mixin 的可尾随
   `$global-flexbox` 参数线程化传入（真值 `$flex` 强制开 flexbox，否则由环境
   `$global-flexbox` 设置决定）；被删除的 `$xy-grid` 反写在 mixin 之后已无读者。对
   `@import` 用户可见行为不变；对 `@use` 消费者，本就不再有"写不进模块 cell"的幻影。
3. **`@use` 模块路径的镜像成员**：`@use 'foundation'` 后所有成员带命名空间
   （`foundation.foundation-button` 等）；与 `@import` 路径的裸全局名等值、live-linked。
   两条路径**不要混在同一次编译**（见限制 4）。
4. **展开模式空行位置**：经 `meta.load-css()` 输出的 CSS 在 expanded 模式下，顶层规则
   之间空行位置与旧路径不同（Dart Sass 序列化行为，1.97.3 / 1.106.1 一致）；空行外内容
   逐字节一致、compressed 逐字节一致。dist 不受影响（dist 入口仍走 `@import` 路径），
   但**任何试图用 load-css 对齐既有 expanded 产物字节序的方案都不可行**（B10 已据此
   否决 docs 本地 partial 的 load-css 迁移）。

## 三类豁免清单（`@import` 终态保留处，用户侧怎么写）

线 B 退出标准"`@import` 0 处"按下列三类豁免口径成立（B9 余量清单 + B10 终态核验）。
用户侧不需要、也不应该绕开它们：

### 1. grid 岛（scss/grid/_grid.scss 内部 8 处：row/column/size/position/gutter/classes/layout/flex-grid）

- **是什么**：float grid 的 8 个 partial 在岛内仍是 `@import` 拼接——这是对
  "一个 partial 一个模块"原则的**有记录例外**（`scss/grid/_grid.scss:13` 注释）。float grid
  整体在 7.0 的 M3 已排期删除（grid 收敛到 xy-grid），先把将死的岛改造成模块是负收益。
- **用户侧怎么写**：什么都不用改。走旧路径照旧 `@import 'foundation'`（或 partial
  路径 `@import 'grid/grid'`）；走模块路径 `@use 'grid/grid'`（`foundation.scss` 已把
  岛聚合为可加载模块，B9）。岛内 @import 是库内部实现细节，编译进的是加载者自己的
  作用域，不产生用户可见的 import 警告路径差异（编译时有 `import` deprecation 警告，
  M3 删岛后自然消失）。

### 2. vendor 桥（scss/vendor/_sassy-lists.scss 内部 7 处，sassy-lists 5 个 function + 2 个 helper）

- **是什么**：vendored 第三方库（`node_modules/sassy-lists` → 构建期拷贝到
  gitignored `_vendor/`），源码是 import 风格相对路径。`scss/vendor/_sassy-lists.scss`
  是给模块世界用的**可跟踪加载门面**（`@forward` 不行——被转发文件在仓库外按构建产物
  存在）；库内只有 `sl-contain()` / `sl-remove()` 两个消费者（xy-grid collapse 等）。
- **用户侧怎么写**：什么都不用改。sassy-lists 成员经 `util/util` 门面与
  `foundation.scss` 的 `@forward 'vendor/sassy-lists'` 双路暴露；用户代码里直接调
  `sl-contain(...)` 在两条路径下都可用。M3 移除 `_vendor`/sassy-lists 时豁免一并消失。

### 3. settings 模板（scss/settings/_settings.scss:74 保留 `@import 'util/util'` 1 处）

- **是什么**：该文件**就是**发给用户拷贝的 settings 模板（dist 随包发布、starter
  项目、CLI 模板同源）。它的正文必须是"裸 import 风格 Sass"：任何 `@use` 形态都会
  与下方数百行 settings 赋值冲突（starred use 会把 util 持有的 settings 变量
  （`$global-font-size`、`$breakpoints`、`$black/$white`…）引进模块，与文件内再赋值
  撞名；namespaced use 则要求逐个限定 `rem-calc()` 调用，模板不可读）。
- **用户侧怎么写**：
  - 留在旧路径：照旧拷贝模板、改值、`@import 'settings/settings'; @import 'foundation';`
    ——完全支持，直到该用户自行迁移到 settings 模块。
  - 走新机制：按上文"三步"把模板**精简成 settings 模块**；模块顶部**保留
    `@import 'util/util';`**（只要还调用 `rem-calc()` 等函数）。不要改成
    `@use "util/util" as *;`——`rem-calc()` 读的 `$global-font-size` 会解析到 util 模块
    自己的 `100% !default` cell，用户对 `$global-font-size` 的赋值会**静默不生效**（见
    限制 5）。库侧（`scss/next/_load-*.scss`）全部走 `@use ... with`，不受此限。

## 当前限制（定稿时点）

1. **组件覆盖范围**（7.0 全量铺开更新）：机制覆盖 **29 个独立组件**——accordion、
   badge、breadcrumbs、button、callout、card、close-button、dropdown、flex/float/visibility
   工具类、label、media-object、menu、off-canvas、orbit、pagination、progress-bar、
   responsive-embed、reveal、slider、sticky、switch、table、tabs、thumbnail、title-bar、
   tooltip、top-bar。**五个结构性耦合组件走旧路径**（`@use 'foundation' as f; @include
   f.foundation-X`，配置经 settings 文件生效）：`button-group`（复用 button 的
   fill mixin）、`accordion-menu`/`drilldown`/`dropdown-menu`（复用 menu 的嵌套 mixin）、
   `menu-icon`（读 title-bar 的图标旋钮，B8 门面契约钉死的跨片活链接）。架构原因：
   Sass 一编译一模块一配置，而它们的模块 plain-load 依赖对象会堵死后者的配置式加载；
   解法是把共享 mixin 参数化（独立切片）。B6-C 镜像规则只救得了纯变量读取
   （试过 menu-icon，因破坏活链接契约而回退）。
2. **一个组件一次编译只能 include 一次**。load unit 是模块，模块只能被配置一次；
   需要第二份不同配置的输出时，另起一次编译。
3. **不能包在 at-rule 里**。`meta.load-css()` 不能出现在 `@media` 等内，mixin 只能
   顶层 include。
4. **别与新旧两条路径混在同一个编译里**：`@import` 与 `@use` 模块缓存互不相通，
   同一组件的 CSS 会输出两遍。
5. **用户模块里的 `rem-calc()` 等函数**：保留 `@import 'util/util';`（编译期有
   `import` deprecation 警告，语义与旧路径完全一致）。不要改成 `@use "util/util" as *;`——
   `rem-calc()` 依赖的 `$global-font-size` 会被解析到 util 模块自己的 `100% !default`，
   用户改了 `$global-font-size` 会**静默不生效**。库侧完成 settings/util 全模块化后
   （或 load unit 暴露 `$global-font-size` 配置键时）再删除这条限制。
6. **反射 map 的"冻结派生值"现象**：`merge-settings()` 返回的是 settings 模块的
   反射结果，`$button-radius` 这类在 settings 里就求好值的键仍是库默认值（如 `0`）；
   load unit 会用用户 map 重新走 `!default` 链派生出 `8px`。直接消费
   `merge-settings()` 调试时注意区分。
7. **null 过滤是机制内部行为**：用户模块 `@import 'util/util'` 会把 util 的
   `$*-color: null !default` 声明并进来，反射 map 里因此有值为 null 的 `*-color`
   键；机制入口统一过滤 null（`-fs-non-null()`），避免空值顶掉派生色。
   `test/sass/_settings_module_user_palette.scss` 就是这条回归的活体样例。
8. **`$-zf-*` / `$_*` 私有变量不反射**，恒为库默认值（本就是内部变量）。
9. **展开模式输出的空行位置**：见"已知语义差异"第 4 条（压缩模式逐字节一致）。

## load-css 约束汇总（机制选型的边界）

- `meta.load-css()` 不能出现在 `@media` / `@supports` 等 at-rule 内 → 组件 mixin
  仅限顶层 include（限制 3）。
- 模块一生只能配置一次 → 组件一次编译一份配置（限制 2）。
- 与 `@import` 缓存不相通 → 单次编译单一路径（限制 4）。
- load-css 块的 expanded 序列化空行与 import 拼接不同 → 产物字节对齐类工作（dist、
  docs 基线）不能走 load-css（语义差异 4）。

## 双轨一致性证据（B2 硬门禁，定稿沿用）

探针在 `/tmp/b2-probes/`（编译命令见 `build.sh` / `compare.sh`，可随时重跑），
编译器为仓库钉定的 `sass-embedded` 1.97.3，`--load-path` 指向仓库 `scss/`。

- 场景（每个都有 button/table 两份）：`defaults`（纯默认）、`palette`（用户改
  `$global-radius` + `$foundation-palette.primary`）、`colors`（用户直接覆盖
  `$primary-color` + `$global-margin` + `$button-padding` + `$button-fill` +
  `$body-font-color`）。旧路径 = 规范的"改过的 settings 拷贝 + `@import`"组合，
  新路径 = settings 模块 + `foundation-next` mixin。
- 结果：**压缩模式 sha256 六组全部一致**；**展开模式去掉空行后逐字节一致**；
  展开模式原始 diff 仅空行（逐对核验 0 个非空行差异）。样例 sha256（压缩）：
  - button-defaults `6b3d61c5…`、table-defaults `711da429…`
  - button-palette `5b854e7c…`、table-palette `44b6a292…`
  - button-colors `3b9d7fe4…`、table-colors `55265944…`
- 附加证据：直接以 `scss/next/_load-*.scss` 为编译入口（不经 `meta.load-css`）时，
  展开模式与旧路径**逐字节一致**（`cmp` 通过）——证明 load unit 本身的变量装配精确，
  空行差异纯属 load-css 序列化层。
- 测试套件 `test/sass/_settings_module.scss` 的两个 CSS 断言（button/table），
  其 expect 块即上述"同一覆盖集的旧路径输出"，防止后续切片漂移。

## 后续切片注意

- 新增一个组件 = 新增 `scss/next/_load-<name>.scss`（照 load-button 的配方：只从
  user map 取键、`null` 落回 `!default`、`@import` 旧 partial、`*-color` 条件重应用、
  `@include foundation-<name>`）+ `foundation-next.scss` 里一个 mixin + 双轨探针跑通。
- load unit 的变量清单按"该组件传递求值实际读到的键"维护，宁缺勿滥：多注入一个
  库默认值就可能切断某条 `!default` 派生链。
