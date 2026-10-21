# foundation-sites 6.9.0 架构评审报告

- 仓库：/home/gp/Enter/foundation（master 分支，v6.9.0）
- 评审日期：2026-10-21
- 目的：为基于 master 的 6.x 最后一个维护版本（纯清理，零破坏）与后续 7.0 划定架构与技术栈边界
- 方法：只读调查（package.json / gulp/* / .github/workflows/main.yml / yarn.lock / patches/ / 测试与文档构建链），关键依赖版本经 npm/GitHub 公开信息核实（2026-10 时点），未核实处以 ⚠️ 标注

---

## 执行摘要

1. 项目可以继续构建，但"能用"全靠旧依赖尚未腐烂：构建链核心是 gulp 4 + webpack 5 + rollup 2 + Babel 7 + sass-embedded，没有 node-sass 这类已炸的硬伤（Sass 编译已用 sass-embedded，见 gulp/tasks/sass.js），这是当前最大的幸运。
2. 最大单点风险是测试基建：mocha-headless-chrome（停滞）承载全部 JS 单测与 bundle 测试；browserstack-runner（多年未维护 + 靠 patches/browserstack-runner+0.9.2.patch 续命）负责跨浏览器测试，且其 CI job 依赖 Ubuntu 24.04 已删除的 apt 包（gconf-service、libappindicator1 等），大概率已红。6.x 应直接删除 BrowserStack job。
3. CI 已在 GitHub Actions（.github/workflows/main.yml），.travis.yml 不存在；但 checkout/setup-node 仍是 v3（已弃用），需 bump；矩阵测 Node 18/20/22，未测 24。
4. 死文件明确可删：bower.json（Bower 已死）、sache.json（Sache 早已关闭）、browserstack.json、patches/、Meteor 通道（package.js、meteor-README.md、.versions 显示 Meteor 版本停在 6.5.3，早已脱节）、package.nuspec（NuGet 通道）。composer.json 建议保留到 7.0 再议。
5. 两类"暗依赖"问题：rimraf 被 4 个 gulp 任务文件 require 但不在 devDependencies（幻影依赖，v4+ API 已变）；gulp4-run-sequence 声明了但零引用（可直接删）。sass-lint（经 gulp-sass-lint）拉入 2018 年的 eslint 2.13.1（yarn.lock 第 9501 行 sass-lint → eslint "^2.7.0"）。
6. Node 基线：engines 为 ">=18.0"，但 Node 18/20 已双双 EOL；2026-10 的 LTS 是 22（维护期，EOL 2027-04）/24（维护期，EOL 2028-04）/26（2026-10 底进入 Active LTS）。当前依赖树在 Node 22 已被 CI 证明可跑，6.x 建议 engines ">=20"、CI 测 22/24。
7. 浏览器基线：.browserslistrc 仍是 "last 2 versions, > 1%"——该查询至今仍把 IE 11 算作支持目标，导致 autoprefixer 保留 -ms- 输出、clean-css 用 compatibility:"ie11"（gulp/tasks/deploy.js）。6.x 应改为显式基线（Chrome/Edge ≥100、Firefox ESR 115、Safari/iOS ≥15.4、not dead），7.0 再抬到 defaults/ESM 线。
8. 6.x 定位建议：6.10.0 = 依赖大扫除 + Node 22/24 支持 + browserslist 基线提升 + 死文件/死通道清理 + CI 修复。API、SCSS 接口、dist 产物形态全部不变；rollup 2→4 与 sass-embedded 跟进属"纯工具链升级、产物等价"，也放进 6.x。一切删除功能/产物变体的（float grid、prototype、AMD/requirejs、panini 文档链、sassy-lists）推到 7.0。

---

## 1. 依赖全景

### 现状
package.json 中 dependencies: {} 为空；运行时依赖全在 peerDependencies：jquery >=3.6.0、motion-ui latest、what-input >=5.2.10。以下为 64 个 devDependencies 全量处置表（"最新"为 2026-10 时点；⚠️ = 未经本次网络核实）。

| 包 | 当前 | 最新(2026-10) | 维护状态 | 建议 | 归属 |
|---|---|---|---|---|---|
| @babel/core / preset-env | ^7.22.10 | 7.29.x（7.x 终线）；Babel 8 已于 2026-06 发布（ESM-only、默认放弃 ES5） | 活跃 | caret 内跟进 7.29；Babel 8 留给 7.0 | 6.x |
| @commitlint/cli / config-conventional | ^17.7.x | 20.x ⚠️ | 活跃 | 升级（可与 husky 一起保持现状） | 6.x P2 |
| autoprefixer | ^10.4.15 | 10.4.x+ ⚠️ | 活跃 | 保持（改 browserslist 即生效） | 6.x 保持 |
| babel-loader | ^9.1.3 | 9.x/10.x ⚠️ | 活跃 | 保持 | 6.x 保持 |
| browser-sync | ^2.29.3 | 3.x ⚠️ | 半活跃 | 保持 2.x（仅本地 serve/visual） | 7.0 |
| browserstack-runner | ^0.9.4 | 0.9.x（多年停更，官方转向 browserstack-node-sdk） | 废弃级停滞 | 移除（连同 browserstack.json、patches/、CI job、相关 scripts） | 6.x P0 |
| chai | ^4.3.7 | 5.x（ESM-only） | 停滞 | 保持 4.x（浏览器内 mocha 需 UMD） | 7.0 |
| chai-jquery | ^2.1.0 | 2.1.0 | 停滞 | 保持 | 7.0 |
| clipboard | ^2.0.11 | 2.0.11 | 冻结但稳 | 保持（文档站复制按钮） | 6.x 保持 |
| corejs-typeahead | ^1.3.3 | 1.3.x | 废弃 | 6.x 保留（gulp/config.js JS_DOCS 在用）；7.0 移除 | 7.0 |
| cz-conventional-changelog | ^3.3.0 | 3.x 停滞 ⚠️ | 停滞 | 随 commitlint 处理 | 6.x P2 |
| doiuse | ^6.0.2 | 6.x ⚠️ | 停滞 | 保持（仅 check:browserSupport 用） | 6.x 保持 |
| foundation-docs | github:（lock 钉 0.3.4/commit 8b1fca7） | 无版本化发布 | 内部冻结 | lock 已钉，保持；建议把 commit 钉进 package.json | 6.x 保持 |
| gulp | ^4.0.0 | 5.0.1（2025-06） | 4.x 停滞、5.x 活跃 | 6.x 保持 4；7.0 升 5 或换 Vite | 6.x/7.0 |
| gulp-add-src | ^1.0.0 | 陈旧 ⚠️ | 停滞 | 仅 customizer 用，保持 | 7.0 清理 |
| gulp-babel | ^8.0.0 | 8.0.0（2019） | 停滞但可用 | 保持 | 7.0 |
| gulp-cache-bust/check-deps/newer/plumber/rename/replace/filter/if/load-plugins/concat/sourcemaps/zip | ^1–^5 | 陈旧但单一稳定 | 多数停滞 | 保持（低风险胶水件） | 6.x 保持 |
| gulp-clean-css | ^4.3.0 | 5.x ⚠️ | 停滞 | 保持 4；6.x 删 compatibility:"ie11" | 6.x 小改 |
| gulp-eslint | ^6.0.0 | 7.x（对应 eslint 6，同死）；eslint 本体 10.13.0、9.x 已于 2026-08 EOL | 死亡链 | 6.x 保持（能跑）；7.0 迁 eslint 10 flat config（保留 semi:never 等规则） | 7.0 |
| gulp-postcss | ^10.0.0 | 10/12.x ⚠️ | 停滞 | 保持 | 6.x 保持 |
| gulp-sass | ^5.1.0 | 6.x ⚠️ | 活跃 | 保持 5.1（与 sass-embedded 组合已在用，勿动） | 6.x 保持 |
| gulp-sass-lint | ^1.4.0 | sass-lint 1.13.1（2018 停更，拉 eslint 2.13.1） | 废弃 | 6.x 可直接删（丢 lint:sass，不影响产物）；7.0 换 stylelint | 6.x 建议删 |
| gulp-uglify | ^3.0.0 | 3.0.2 | 停滞但稳 | 保持；7.0 换 terser | 6.x 保持 |
| gulp4-run-sequence | ^1.0.2 | — | 零引用死依赖 | 直接删除（gulp/ 下无任何 require） | 6.x P1 |
| husky | ^8.0.3 | 9.x ⚠️ | 活跃 | 保持 8（.husky/ hooks 正常） | 6.x 保持 |
| is-empty-object/prettyjson/strip-indent/kleur/require-dir/vinyl/vinyl-named/undertaker-forward-reference | ^1–^3 | 微型/陈旧 | 停滞 | 保持（customizer/gulpfile 胶水） | 6.x 保持 |
| jquery（dev+peer） | >=3.6.0（lock 3.7.1） | 3.7.1（4.0 仍 beta ⚠️） | 活跃 | 保持 peer 不变 | 6.x 保持 |
| js-yaml | ^3.12.1 | 4.x（safeLoad 已删） | 3.x 停滞 | 升 4 + safeLoad→load（仅 gulp/tasks/customizer.js 一处） | 6.x P2 |
| mocha | ^10.7.3 | 11.x ⚠️ | 活跃 | caret 内跟进 | 6.x P2 |
| mocha-headless-chrome | ^4.0.0 | 4.x（2025-07 有发布但实质停滞） | 停滞 | 6.x 保持（唯一 runner，动它=重写测试）；7.0 换 Playwright | 6.x 保持/7.0 替换 |
| motion-ui（dev+peer） | ^2.0.5（lock 2.0.8） | 2.0.8 | 冻结 | 保持；peer latest 改 ^2.0.0 | 6.x 小改 |
| sassdoc | latest（lock 1.0.1） | 1.0.1 ⚠️ | 冻结 | 保持（deploy:settings 用） | 6.x 保持 |
| panini | latest（lock 1.7.2） | 1.7.2（2021 后停更） | 废弃 | 6.x 保持；7.0 换 Eleventy/VitePress | 6.x 保持 |
| patch-package | ^8.0.0 | 8.x | 活跃 | 保持；删 BrowserStack patch 后保留机制 | 6.x 保持 |
| postcss | ^8.4.28 | 8.x ⚠️ | 活跃 | caret 内跟进 | 6.x P2 |
| requirejs | ^2.3.6 | 2.3.7 | 停滞 | 6.x 保持（test/bundle/index.html AMD 测试在用）；7.0 随 AMD 测试删 | 6.x 保持 |
| rollup | ^2.79.2 | 4.64.x（活跃；2.x 停滞；2026-02 披露过 CVE-2026-27606，旧线不吃修复） | 2.x 停滞 | 升 4（rollup-plugin-babel → @rollup/plugin-babel，配置小改） | 6.x P1 |
| rollup-plugin-babel | ^4.3.0 | 已废弃 | 废弃 | 随 rollup 4 替换 | 6.x P1 |
| sass-embedded | ^1.79.3 | 1.105.2（活跃，2026-10 仍发布） | 活跃 | caret 内跟进；保持 gulp-sass 5 组合 | 6.x P1 |
| sass-true | ^8.0.0 | 8.x/9.x ⚠️ | 活跃 | caret 内跟进 | 6.x P2 |
| sassy-lists | ^3.0.1 | 3.0.1 | 废弃（Dart Sass 原生 map 已普及） | 6.x 保持（牵动 scss/foundation.scss 的 _vendor import、sass:deps）；7.0 移除 | 7.0 |
| sinon | ^7.2.2 | 19.x+ ⚠️ | 活跃 | 6.x 保持 7（升级有 API 断裂，收益低）；7.0 升 | 7.0 |
| supercollider | latest（lock 1.5.3） | 1.5.3 ⚠️ | 冻结 | 保持；建议钉确切版本 | 6.x 保持 |
| webpack | ^5.88.2 | 5.x（无 webpack 6，官方 2026 路线图继续 5.x） | 活跃 | caret 内跟进 | 6.x P2 |
| webpack-stream | ^7.0.0 | 7.x ⚠️ | 停滞 | 保持；7.0 去 stream 层 | 6.x 保持 |
| what-input（dev+peer） | >=5.2.10（lock 5.2.12） | 5.2.12 | 冻结 | 保持 | 6.x 保持 |
| （幻影）rimraf | 未声明（传递依赖） | 4/5.x（回调式 API 已删） | 活跃但 API 断裂 | 显式加入 devDependencies（^3）或改 fs.rmSync；被 gulp/tasks/{clean,deploy,customizer,test}.js 四处 require | 6.x P1 |

### 问题
- peerDependencies 里 motion-ui: "latest" 是反模式（任何未来 3.x 会被自动接受）。
- 依赖树化石：sass-lint→eslint 2.13.1（2018）、sinon 7（2019）、gulp-babel 8（2019）、rollup 2（2020-22）。不阻塞构建但持续制造 audit 噪音；package.json 的 6 条 resolutions 是历史补丁痕迹。
- 幻影依赖 rimraf 是唯一"lock 重排随时可能炸任务"的项。

### 建议
- 6.x：P0/P1 项（移除 BrowserStack 全套、删 gulp4-run-sequence、声明 rimraf、rollup 2→4、sass-embedded 跟进、Babel/webpack/postcss caret 跟进）；peer motion-ui 改 ^2.0.0。
- 7.0：gulp 4→5 或 Vite、eslint 10 flat config、stylelint、Playwright、Babel 8、文档链替换、删 requirejs/AMD、typeahead 替换。

### 风险
- mocha-headless-chrome 内嵌旧 puppeteer 下载固定版本 Chromium，OS/Node 升级可能失败 → 所有 JS 测试同时失效。
- rollup 2→4 是 6.x 唯一非 caret 升级，需 deploy:prep 后 diff dist 验证等价。

---

## 2. 死重 / 该移除的文件

| 文件 | 核查 | 结论 |
|---|---|---|
| bower.json | Bower 已弃用；仅 gulp/config.js VERSIONED_FILES 与 .npmignore 引用 | 6.x 删除（同步从 VERSIONED_FILES 移除）；Bower 用户仍可从 git tag 装，风险≈0 |
| sache.json | Sache 注册表早已关闭，零引用 | 6.x 删除 |
| browserstack.json + patches/browserstack-runner+0.9.2.patch | 仅 test:javascript:browserstack 脚本与 CI job 消费 | 6.x 删除（连同 scripts 与 CI job） |
| package.js + meteor-README.md + .versions | .versions 停在 zurb:foundation-sites@6.5.3、meteor@1.9.2，与 6.9.0 脱节——通道实际早已弃更 | 6.x 删除 |
| package.nuspec | NuGet 通道元数据；发布动作已不在 CI/文档 | 6.x 删除 |
| composer.json | Packagist 仍收录；文件无版本字段（deploy:version 对它是 no-op） | 6.x 保留（成本≈0），7.0 再议 |
| .travis.yml | 不存在（已迁 .github/workflows/main.yml） | 无需动作 |
| npm-shrinkwrap.json | 不存在（有 yarn.lock） | 无需动作 |
| package.json jspm/browserify 字段 | jspm 边缘化；babelify 未安装 | 6.x 顺手删（eyeglass 字段 7.0 删） |
| webpack.config.js 的 module.loaders 空键 | webpack 1 时代残留（webpack 5 只读 rules） | 6.x 顺手删 |

风险点：docs/pages 若仍写 Bower/Meteor 安装说明需同 PR 更新（发布前 grep 一遍 docs/pages/）。

---

## 3. 构建管线架构

### 现状
任务图（gulpfile.js + gulp/tasks/*，undertaker-forward-reference 支持 v3 式前向引用）：
- sass：assets/foundation*.scss 4 入口 → sass:deps（拷 sassy-lists 到 _vendor/，_vendor 有 7 个文件被 git 跟踪，因 scss/foundation.scss 直接 @import '../_vendor/...'）→ gulp-sass(sass-embedded) → autoprefixer（读 .browserslistrc）→ _build/assets/css/。
- js：js/entries/foundation.js + 31 个 entries/plugins → webpack-stream（UMD，utils.umdExternals 映射到 __FOUNDATION_EXTERNAL__ 命名空间）→ _build；rollup 仅在 deploy 阶段产出 cjs/esm/es6（rollup.config.js，deploy:dist:bundles 调 JS API）。
- docs：panini + supercollider + foundation-docs + search 索引。
- deploy：deploy:prep（交互输版本 → deploy:version 对 VERSIONED_FILES 9 文件做字符串替换 → 重建 dist）+ deploy（含 deploy:commit：git commit+tag+push origin develop）。
- 四个 CSS 变体：foundation.scss（flexbox）、foundation-float.scss（$global-flexbox:false + foundation-everything($flex:false)，老 float 网格）、foundation-prototype.scss、foundation-rtl.scss。
- dist 被 git 跟踪：151 文件、约 13MB；dist/js/foundation.d.ts 来自 js/typescript/foundation.d.ts（文件头仍写 v6.3.1，注释失真无功能影响）。

### 问题（可用性风险排序）
1. deploy:commit 硬编码 git push origin develop——master 化维护后发版第一步就撞墙。
2. mocha-headless-chrome——所有 JS 测试的承载层。
3. rollup 2 + rollup-plugin-babel 4（废弃）只在 deploy 期运行：平时 CI 不覆盖，腐坏被掩盖到发版日才爆。
4. sass:deps + _vendor 双份机制冗余，但 sassy-lists 不动就不会坏。
5. resolutions 6 条是旧漏洞修复化石，升级后应逐条验证可否删除。
6. gulp4-run-sequence 等 v3 兼容层是纯历史包袱（前者已零引用）。

### 建议
- 6.x 最小必要修复：deploy:commit 改指 master（或只 commit+tag、push 人工）；rollup 升 4 并 diff dist；删 gulp4-run-sequence；声明 rimraf；删 clean-css ie11 兼容。
- 7.0 重构方向：gulp 4→5（任务图全显式 series/parallel）或换 sass CLI + esbuild/Vite + SSG；float/prototype 变体退役（先发 deprecation note）。

### 风险
- 改 gulp 任务文件可能踩 forward-reference 隐式依赖，改完必须完整跑 yarn test 而非子任务。

---

## 4. Node 版本支持

### 现状
- engines："node": ">=18.0"。
- CI（main.yml build job）：Node 18/20/22 × ubuntu/windows/macos；另两个 job 只测 22。
- 无 native 编译重灾区（无 node-sass；sass-embedded 是预编译二进制）。
- 2026-10 生命周期：18 EOL(2025-04)、20 EOL(2026-04)；22 Maintenance LTS(EOL 2027-04)；24 Maintenance LTS(EOL 2028-04)；26 将于 2026-10 底进入 Active LTS。

### 基线建议表
| 目标 | engines | CI 矩阵 | 说明 |
|---|---|---|---|
| 6.x（推荐） | ">=20" | 22、24（ubuntu 必测；mac 至少一档） | 20 刚 EOL 半年；代码不用 20+ 独占 API，18 用户大概率仍可跑 |
| 6.x（保守备选） | 保持 ">=18" | 20、22、24 | 零争议方案：只给 CI 加 24 |
| 7.0（推荐） | ">=22" 或发布时点在保 LTS 集合 | 24、26 | 发布（预计 2027）时 22 接近 EOL，以 24 为最低在保线 |

### 问题/风险
- engines 声称支持两条 EOL 线，参考价值失效。
- mocha-headless-chrome（内嵌旧 puppeteer）是 Node 24 兼容性最大未知数，6.x 开发早期必须验证（见第 10 节 P0）。

---

## 5. 浏览器支持基线

### 现状
.browserslistrc 原文（全文）：
```
# Browsers that we support
last 2 versions
> 1%
```
不含 not dead → caniuse-lite 仍把 IE 11 与一众死浏览器计入。连锁：autoprefixer 持续输出 -ms- 前缀；deploy.js 压缩用 cleancss({compatibility:"ie11"})（customizer 任务里还有 "ie9"）；doiuse check 按同基线报警。.babelrc 只有 preset-env、无独立 targets → Babel 同样吃 .browserslistrc，dist JS 按含 IE11 的目标输出 ES5。
2026-10 市场现状：IE 彻底退场（2022-06 退役）；Firefox ESR 115/128/140 并存；Safari 主流 16-26 ⚠️；Chrome/Edge 140+；Chrome 100 以下份额可忽略。

### 基线建议表
| 目标 | .browserslistrc | 最低浏览器 | 连带影响 |
|---|---|---|---|
| 6.x（推荐） | 显式：Chrome >= 100、Edge >= 100、Firefox >= 115（ESR）、Safari >= 15.4、iOS >= 15.4、not dead | 2022 年代浏览器 | autoprefixer 大减 -ms- 输出；删 deploy.js 的 compatibility:"ie11"；doiuse 对齐；JS 保持 ES5 输出不动（dist 是 CDN 最后一公里；若要抬 JS 目标需单独给 Babel 配 targets 并明示 changelog） |
| 7.0（推荐） | defaults 或 ESM 线：Chrome >= 120、Edge >= 120、Firefox >= 128、Safari >= 17、iOS >= 17 | 2023-24 年代浏览器 | Babel 大部分转译可撤（配合 Babel 8 非 ES5 默认）；foundation.es6.js 转正；删 js/foundation.util.mediaQuery.js 等处老 polyfill 兜底与 scss/components/_card.scss 的 IE hack（仓库内唯一 grep 到的显式 ie 标记）；float/rtl 变体重估；terser/clean-css 现代化 |

### 风险
- 基线提升改变 dist CSS 字节（删前缀/hack），是"内容变化"非"行为破坏"，但必须在 changelog 显著声明。
- 6.x 只动 CSS 侧、不动 JS 转译等级，避免回滚定位困难。

---

## 6. 文档站构建链

### 现状
docs/（66 页 markdown）→ gulp/tasks/docs.js：panini 1.7.2（Handlebars 布局）+ supercollider 1.5.3 + foundation-docs（github tarball 钉 commit 8b1fca7 / 0.3.4）+ sassdoc（搜索索引 sass 文档）→ _build，browser-sync 预览。文档 JS/CSS 另有 javascript:docs / sass:docs，依赖 corejs-typeahead、clipboard。

### 问题
- panini/supercollider/sassdoc 三件套停更 3-8 年；panini/supercollider 写 "latest" 全靠 yarn.lock 钉死才稳定。
- foundation-docs 非版本化 github 依赖，上游仓库变动即安装失败（lock 已钉 commit，老环境没事）。
- docs:pages 的 gulp-newer 增量 + panini.init 有缓存陈旧问题，开发体验差但能跑。

### 建议
- 6.x：不动（内部工具，坏了不影响包）；可选把 panini/supercollider 的 latest 改确切版本、foundation-docs 的 commit 钉进 package.json。
- 7.0：替换为 Eleventy（Handlebars/markdown 心智迁移成本最低）或 VitePress/Astro；搜索索引一并重做（M-L 工程量）。

### 风险
- 6.x 期间 foundation-docs 上游若有不兼容变动，新机器 yarn install 会失败——把 commit 钉进 package.json 可防 lock 丢失。

---

## 7. 发布与版本管理

### 现状
- dist/（13MB、151 文件）被 git 跟踪；发布 = deploy:prep（交互输版本 → 替换 VERSIONED_FILES 9 文件 → 重建 dist）→ deploy（commit/tag/push）→ 手动 npm publish。
- VERSIONED_FILES：bower.json、composer.json、docs/pages/installation.md、js/foundation.core.js、meteor-README.md、package.js、package.json、scss/foundation.scss、scss/settings/_settings.scss。composer.json 实为 no-op；bower/meteor 三项已判死。
- 分发渠道：npm（主）+ jsdelivr/unpkg（installation.md 示例即 cdn.jsdelivr.net/npm/foundation-sites@6.9.0/dist/...）+ Packagist + 已死的 Bower/Meteor/NuGet/Sache。

### 问题
1. deploy:commit 写死 push origin develop。
2. dist 入 git：利 = CDN/GitHub 直链稳定快照；弊 = 每版 13MB 历史增长、diff 噪音、忘跑 deploy:prep 就 tag 的人为风险。
3. deploy 把 commit+tag+push 打包一步且无 dry-run。
4. foundation.d.ts 头部注释停在 v6.3.1、.versions 停在 6.5.3——版本同步机制已漏掉一半通道，反证这些通道该删。

### 建议
- 6.x：deploy:commit 改指 master（或拆成 commit+tag 本地、push 人工）；VERSIONED_FILES 删死通道文件；motion-ui peer latest→^2.0.0；dist 继续跟踪（6.x 最重要的兼容承诺之一就是 CDN 直链不断）；changelog 声明 dist CSS 字节变化。
- 7.0：讨论 dist 移出 git（jsdelivr/unpkg 可直接服务 npm 包内容，npm 包本就含 dist）；发布脚本加 dry-run 或换 Changesets；foundation.d.ts 版本注释自动化或删。

### 风险
- 发版日最大操作风险是 rollup 升级后 dist 静默变化——"deploy:prep 后人工 review dist diff"一步勿省略。

---

## 8. CI/CD

### 现状
.github/workflows/main.yml（唯一 workflow，on: [push, pull_request]）三个 job：
1. build_latest_browserstack：ubuntu+Node 22，装一大串 apt 包后跑 test:javascript:browserstack（依赖 BROWSERSTACK_* secrets）。
2. build_latest：ubuntu+Node 22，跑 test:single-process。
3. build：ubuntu/windows/macos × Node 18/20/22，跑 yarn test。
全部用 actions/checkout@v3、actions/setup-node@v3；无缓存；无 publish job。.travis.yml 已不存在；.sonarcloud.properties 为空。

### 问题
- browserstack job 三重死：runner 停更、apt 列表含 Ubuntu 24.04 已移除的 gconf-service/libappindicator1（ubuntu-latest 上 apt-get 直接失败）、secrets 可能过期。
- actions v3 已弃用（应 v4/v5 ⚠️）。
- Node 矩阵含两条 EOL 线、缺 24；yarn 无缓存。

### 6.x 最小修复
1. 删 build_latest_browserstack job + 相关 scripts（P0）。
2. checkout/setup-node bump v4/v5（P0）。
3. Node 矩阵改 20/22/24 或 22/24，保留三平台（P1）。
4. setup-node 加 cache: yarn（P2）。
5. build/build_latest 里的 apt 包是给 headless Chrome 的需保留，但需精简 24.04 已不存在的包名并实测。
- 7.0：Playwright 跨浏览器矩阵替代 BrowserStack 原始诉求。

### 风险
- GitHub 侧对 v3 action 彻底拒绝运行时整个 CI 熄火——6.x 启动前应完成修复。

---

## 9. 6.x vs 7.0 边界建议

### 6.x（零破坏，建议 6.10.0）："依赖大扫除 + Node 22/24 + 基线提升 + 死文件清理"
- 删除：BrowserStack 全套（依赖/browserstack.json/patches/scripts/CI job）；gulp4-run-sequence；bower.json；sache.json；package.js/meteor-README.md/.versions；package.nuspec；package.json 的 jspm/browserify 字段。
- 修复：声明 rimraf（或 fs.rmSync）；deploy:commit 改 master；CI actions bump；CI Node 加 24。
- 工具链升级（产物等价）：rollup 2→4（+@rollup/plugin-babel）；sass-embedded/webpack/postcss/autoprefixer/mocha/sass-true caret 跟进；js-yaml 3→4；engines ">=20"。
- 基线：.browserslistrc 显式化（Chrome/Edge ≥100、FF ≥115、Safari/iOS ≥15.4、not dead）；删 clean-css ie11。
- 保持：gulp 4、Babel 7（ES5 dist）、panini 文档链、sassy-lists/_vendor、mocha-headless-chrome、sinon 7、dist 跟踪、四个 CSS 变体、全部 JS API/SCSS 接口。
- 文档：changelog 声明 dist CSS 字节变化与移除的分发通道；installation.md 清理 Bower/Meteor 段落。

### 7.0 才能做
- gulp 4→5 或 Vite/esbuild；Babel 8/放弃 ES5 dist（foundation.es6.js 转正）。
- eslint 10 flat config、stylelint 替代 sass-lint、Playwright 替代 mocha-headless-chrome、删 requirejs/AMD 测试。
- 浏览器基线抬到 defaults/ESM 线；float 网格变体与 scss/grid/ float 实现退役、prototype 变体重估。
- 移除 sassy-lists/_vendor、corejs-typeahead；文档链整体替换；eyeglass 字段删；dist 是否出 git；composer.json 去留。

---

## 10. 风险清单（单点故障，按优先级）

| # | 风险点 | 位置 | 失效后果 | 优先级 |
|---|---|---|---|---|
| 1 | mocha-headless-chrome（内嵌旧 puppeteer/Chromium） | package.json 全部 test:javascript:*/test:bundle* scripts | 所有 JS 测试无法运行，CI 全红，失去回归能力 | P0（6.x 验证+必要时 patch；7.0 替换） |
| 2 | BrowserStack 链（runner 停更 + patch 依赖 S3 二进制 + apt 包在 ubuntu-latest 已不存在 + secrets） | browserstack.json、patches/、main.yml | CI job 长红/熄火，噪音掩盖真实失败 | P0（直接删除） |
| 3 | actions/checkout@v3、setup-node@v3 弃用 | main.yml 全部 job | GitHub 强制迁移后 CI 全停 | P0 |
| 4 | 幻影依赖 rimraf（未声明，v4+ API 断裂） | gulp/tasks/{clean,deploy,customizer,test}.js | lock 重排后 clean/deploy 抛错，发版流程瘫痪 | P1 |
| 5 | rollup 2 + rollup-plugin-babel 4 废弃链只在发版期运行 | rollup.config.js、deploy:dist:bundles | 平时测试不覆盖，发版日才爆 | P1（6.x 升 4） |
| 6 | deploy:commit 硬编码 push origin develop | gulp/tasks/deploy.js | master 化维护后首次发版即撞墙 | P1 |
| 7 | foundation-docs 非版本化 github 依赖（靠 lock 钉） | package.json / yarn.lock | 上游变动 → 新环境 install 失败 | P1（commit 钉进 package.json） |
| 8 | sass-embedded 平台二进制分发差异 | gulp-sass 5 + sass-embedded | 特定平台编译失败（包活跃，低概率） | P2 |
| 9 | panini/supercollider 的 "latest" 无版本钉 | package.json | 无 lock 安装时漂移 | P2 |
| 10 | webpack-stream（停滞的 gulp↔webpack 桥） | gulp/tasks/javascript.js、customizer.js | 桥层与 webpack 新小版本不兼容 | P2（6.x 不动） |

---

## 优先级总表

| 优先级 | 归属 | 事项 | 工作量 | 风险 |
|---|---|---|---|---|
| P0 | 6.x | 删除 BrowserStack 全套（依赖+配置+patch+scripts+CI job） | S | 低 |
| P0 | 6.x | CI actions v3→v4/v5、apt 包适配 ubuntu-latest | S | 低 |
| P0 | 6.x | Node 24 上验证 mocha-headless-chrome / 全测试链 | S–M | 中 |
| P1 | 6.x | 声明 rimraf 或改 fs.rmSync | S | 低 |
| P1 | 6.x | rollup 2→4 + @rollup/plugin-babel，deploy:prep 后人工 diff dist | M | 中 |
| P1 | 6.x | deploy:commit 改 master；VERSIONED_FILES 剔除死通道 | S | 低 |
| P1 | 6.x | .browserslistrc 显式基线 + 删 ie11 clean-css | S | 低（dist CSS 字节变化需声明） |
| P1 | 6.x | 删 bower.json/sache.json/package.js/meteor-README/.versions/package.nuspec/gulp4-run-sequence | S | 低 |
| P1 | 6.x | engines ">=20"；CI 矩阵 20/22/24 或 22/24 | S | 低 |
| P2 | 6.x | sass-embedded/webpack/postcss/mocha/sass-true caret 跟进；js-yaml 4；motion-ui peer 改 ^2.0.0；foundation-docs 钉 commit；CI 缓存；可选删 sass-lint | M | 低–中 |
| P2 | 7.0 | gulp 5 / Vite 评估、eslint 10、stylelint、Babel 8、dist 出 git | L | 高 |
| P2 | 7.0 | Playwright 替换 mocha-headless-chrome + 删 requirejs AMD 测试 | L | 中 |
| P2 | 7.0 | 文档链替换（panini/supercollider/sassdoc/foundation-docs → Eleventy/VitePress） | L | 中 |
| P2 | 7.0 | float/prototype 变体与 sassy-lists 退役、browserslist 抬 defaults/ESM | M | 中 |

---

## "6.x 维护版本应做的事" Checklist

- [ ] CI：删 browserstack job；actions bump v4/v5；Node 矩阵加 24；apt 包适配 ubuntu-latest
- [ ] 在 Node 22 与 24 完整跑通 yarn test（build + sass + JS units + bundle），作为 6.x 准入基线
- [ ] 移除 browserstack-runner、browserstack.json、patches/ 全部内容；同步删 test:javascript:browserstack 与 test:javascript:ci* 中的 browserstack 段
- [ ] devDependencies 加显式 rimraf@^3（或四个任务文件改 fs.rmSync）；删 gulp4-run-sequence
- [ ] rollup → 4.x，rollup-plugin-babel → @rollup/plugin-babel；用 gulp deploy:prep 演练并 review dist diff
- [ ] gulp/tasks/deploy.js 的 deploy:commit 改指 master（或拆为本地 commit+tag）
- [ ] gulp/config.js VERSIONED_FILES 删 bower.json、meteor-README.md、package.js
- [ ] 删除 bower.json、sache.json、browserstack.json、package.js、meteor-README.md、.versions、package.nuspec
- [ ] package.json：engines ">=20"；删 jspm/browserify 字段；motion-ui peer latest→^2.0.0；panini/supercollider 钉确切版本；foundation-docs 钉 commit
- [ ] .browserslistrc 显式基线（Chrome/Edge ≥100、Firefox ≥115、Safari/iOS ≥15.4、not dead）；deploy.js 删 compatibility:"ie11"
- [ ] caret 内跟进 sass-embedded/webpack/postcss/autoprefixer/mocha/sass-true；js-yaml 3→4（customizer.js 一处 safeLoad→load）；逐条验证 resolutions 可否删
- [ ] （可选）删 gulp-sass-lint / lint:sass 任务
- [ ] 文档：installation.md 清理 Bower/Meteor 段落；changelog 声明 dist CSS 字节变化、Node 基线、移除的分发通道
- [ ] 发版演练：deploy:prep → 人工 diff → tag → npm publish 全流程走一遍再正式发 6.10.0
