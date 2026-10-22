# 线 B · settings 配置机制迁移指南（草稿）

状态：**草稿**（B2 切片产出，尚不进 `docs/pages/`；定稿随 settings 拆分切片一起发布）。
机制代码：`scss/foundation-next.scss`（入口）+ `scss/next/`（逐组件 load unit）。
契约回归网：`test/sass/_settings_override.scss`（B1，旧路径）、`test/sass/_settings_module.scss`（B2，新机制）。

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

### 第 3 步：核对覆盖点语义（新旧对照）

| 场景 | 旧路径行为 | 新机制行为 |
|---|---|---|
| 改 `$global-radius` | settings 里赋值，`_global.scss` 的 `!default` 接住，`$button-radius: $global-radius !default` 跟随 | 同左（load unit 只注入用户实际设置的键，`!default` 链在 unit 内照常派生） |
| 改 `$foundation-palette` | settings 里赋值 + `add-foundation-colors()` 反写 5 色 | user map 合并生效；5 色在配置期从**生效后的调色板**派生 |
| 直接赋 `$primary-color` | 必须写在 settings 的 `add-foundation-colors` 之后、且在 `_global` 再次反写前才不丢（B1 用例的写法：`@import 'global'` 之后） | 模块里直接赋值即可，机制保证其优先于调色板派生 |
| 改 `$button-*` 等组件变量 | settings 里赋值，组件 partial 的 `!default` 接住 | 同左 |
| 部分编译（只要 button/table） | 手工 `@import` 对应 partial（顺序易错） | 一行 mixin，依赖由 load unit 固定 |

## 当前限制（截至 B2）

1. **组件覆盖范围**：机制只接了 `foundation-button` / `foundation-table` 两个试点。
   其余组件待后续切片逐个接入 load unit；期间继续走旧 `scss/foundation.scss` 路径。
2. **一个组件一次编译只能 include 一次**。load unit 是模块，模块只能被配置一次；
   需要第二份不同配置的输出时，另起一次编译。
3. **不能包在 at-rule 里**。`meta.load-css()` 不能出现在 `@media` 等内，mixin 只能
   顶层 include。
4. **别与新旧两条路径混在同一个编译里**：`@import` 与 `@use` 模块缓存互不相通，
   同一组件的 CSS 会输出两遍。
5. **用户模块里的 `rem-calc()` 等函数**：暂时保留 `@import 'util/util';`（会报
   deprecation 警告，语义与旧路径完全一致）。不要改成 `@use "util/util" as *;`——
   `rem-calc()` 依赖的 `$global-font-size` 会被解析到 util 模块自己的 `100% !default`，
   用户改了 `$global-font-size` 会**静默不生效**。等 settings/util 完成模块化后删除
   这条限制。
6. **反射 map 的"冻结派生值"现象**：`merge-settings()` 返回的是 settings 模块的
   反射结果，`$button-radius` 这类在 settings 里就求好值的键仍是库默认值（如 `0`）；
   load unit 会用用户 map 重新走 `!default` 链派生出 `8px`。直接消费
   `merge-settings()` 调试时注意区分。
7. **null 过滤是机制内部行为**：用户模块 `@import 'util/util'` 会把 util 的
   `$*-color: null !default` 声明并进来，反射 map 里因此有值为 null 的 `*-color`
   键；机制入口统一过滤 null（`-fs-non-null()`），避免空值顶掉派生色。
8. **`$-zf-*` / `$_*` 私有变量不反射**，恒为库默认值（本就是内部变量）。
9. **未知键静默忽略**：settings 模块里的笔误（如 `$gobal-radius`）不会报错。校验
   （未知键 @warn/@error）留待后续切片。
10. **展开模式输出的空行位置**：经 `meta.load-css()` 输出的 CSS 在**展开**
    （expanded）模式下，顶层规则之间的空行位置与旧路径不同（dart-sass 对
    load-css 块的序列化行为，1.97.3 与 1.106.1 一致）；空行外的内容逐字节一致、
    压缩模式逐字节一致（见下方证据）。对产物无语义影响，dist 侧不受影响。

## 双轨一致性证据（B2 硬门禁）

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
