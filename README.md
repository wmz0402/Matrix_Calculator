# 矩阵计算器（精确有理数）

纯前端矩阵计算器。数学内核使用 `BigInt` 有理数，因此整数、分数和有限小数在整个计算过程中都不会产生浮点舍入误差。

## 功能

- 矩阵加减、乘法、转置、迹和整数幂
- 行列式、逆矩阵、伴随矩阵和秩
- REF、RREF，以及结构化行变换步骤
- 求解 `AX = B`，区分唯一解、无穷多解和不相容系统
- 零空间、列空间和行空间的一组基
- PLU 分解
- 精确特征多项式 `det(λI - A)`
- MathJax 精确结果、单步/批量推导浏览，以及 LaTeX 一键复制
- 深浅色主题、响应式布局和常用算例快捷入口

伴随矩阵支持奇异矩阵。对于无穷多解，结果会给出一个特解和零空间基；基向量默认按列排列。

## 本地运行

需要 Node.js `20.19+` 或 `22.12+`。

```bash
npm install
npm run dev
```

浏览器访问 Vite 输出的本地地址。项目已使用 ES modules 和 TypeScript，因此不再建议直接双击打开 `index.html`。

生产构建：

```bash
npm run build
npm run preview
```

## 部署到 GitHub Pages

仓库包含 `.github/workflows/deploy.yml`，推送到默认分支后会自动构建并部署 `dist`。工作流通过 GitHub Pages 提供的 `base_path` 动态设置 Vite 的资源路径，因此 fork 后即使修改仓库名、默认分支或配置自定义域名，也不需要手动修改 `vite.config.ts`。

首次部署需要在 GitHub 仓库中完成一次设置：

```text
Settings → Pages → Build and deployment → Source → GitHub Actions
```

之后可以在 `Actions → Deploy to GitHub Pages` 查看部署进度，也可以通过 `workflow_dispatch` 手动选择分支部署。fork 用户需要先在自己的仓库中启用 GitHub Actions，并单独完成上述 Pages 设置。

默认情况下，项目仓库会部署到：

```text
https://<用户名>.github.io/<仓库名>/
```

如果仓库名为 `<用户名>.github.io` 或使用自定义域名，工作流会自动使用根路径 `/`。

## 输入格式

- 行使用换行或分号分隔；
- 列使用空格或逗号分隔；
- 支持整数、分数和有限小数，例如 `-2`、`3/4`、`0.125`；
- 矩阵的每一行必须具有相同列数。

示例：

```text
1 0 1
2 1 0
-3 2 -5
```

## 界面与交互

- 计算结果使用 MathJax 直接排版，右上角按钮可以复制完整 LaTeX 源码；
- 存在行变换记录时，结果下方会直接显示推导区域，无需切换标签页；
- 推导区域默认使用单步浏览：左侧选择步骤，右侧对照变换前后矩阵，并高亮本次发生变化的行；
- 单步浏览支持第一步、上一步、下一步和最后一步，也可以使用 `←`、`→`、`Home`、`End`；
- “全部展开”模式用于纵览推导，每批加载 16 步，并支持统一展开或收起；
- 移动端会隐藏步骤侧栏，通过前后按钮浏览，并将两个矩阵改为上下排列；
- 在任意矩阵输入框中按 `Ctrl + Enter` 或 `⌘ + Enter` 可以立即计算；
- 深浅色主题会保存在浏览器本地，所有矩阵计算也都在本机完成。

## 架构

```text
src/
  components/    矩阵编辑器、运算台、结果、步骤浏览器与公式组件
  composables/   计算器状态、示例载入和主题状态
  core/          Rational、Matrix、输入解析和结构化错误
  algorithms/    基础运算、消元、求解、子空间、PLU 等
  format/        LaTeX 格式化
  ui/            运算元数据、示例和纯计算视图模型
  App.vue        页面布局与键盘交互
  theme.ts       PrimeVue Aura 语义主题
  main.ts        Vue 应用入口
tests/           单元、性质和页面集成测试
scripts/         Python 独立数学校验器
```

前端使用 Vue 3、PrimeVue 和 Lucide 图标；界面采用“数学研习工作台”的视觉方向，并针对桌面和移动设备分别排版。计算视图模型不依赖 DOM，`core` 与 `algorithms` 也不依赖 Vue，因此界面状态和精确数学内核可以分别维护、测试。

行变换记录存储为 `swap`、`scale` 和 `addMultiple` 事件，而不是中文字符串或每一步的完整矩阵副本。步骤面板默认只渲染当前步骤，并缓存少量矩阵快照；批量模式每次加载 16 步，避免长推导阻塞页面。

## 正确性验证

运行 TypeScript 类型检查和 Vitest 测试：

```bash
npm run typecheck
npm test
```

测试包括固定用例、边界条件、随机性质测试、纯视图模型测试和 Vue 页面集成测试，验证内容包括：

- `RREF(RREF(A)) = RREF(A)`；
- `det(AB) = det(A)det(B)`；
- `A A⁻¹ = I`；
- `PA = LU`；
- 求解结果重新代入满足 `AX = B`；
- 奇异伴随矩阵、超定/欠定/不相容系统及多右端矩阵。

如果本机安装了 Python 3.10 或更高版本，还可以运行独立交叉验证：

```bash
npm run verify:python
```

该命令使用 Python 标准库 `fractions.Fraction` 和一套独立算法，对随机矩阵的行列式、RREF、秩、逆矩阵及特征多项式进行比对，不依赖 SymPy。

## 实现说明与限制

- 行列式使用 Bareiss 消元，减少精确运算中的中间分数膨胀；
- 特征多项式使用 Faddeev–LeVerrier 算法；
- 默认限制输入矩阵为 100 行、100 列，核心层最多接受 1,000,000 个元素；
- 行变换默认最多记录 10,000 步，达到上限后仍会完成最终计算；
- 奇异矩阵的余子式伴随计算目前限制为 8 阶；秩不超过 `n-2` 时会直接返回零伴随矩阵；
- 精确分数的分子和分母可能快速增长，大矩阵仍可能较慢；
- 特征值、QR 和 SVD 通常需要无理数、复数或浮点容差，暂未混入有理数内核；
- MathJax 仍由 CDN 加载。离线时原始 LaTeX 文本和推导步骤矩阵可用，但排版后的结果公式可能不可用。

---

# Matrix Calculator (Exact Rational Arithmetic)

A frontend-only matrix calculator backed by exact `BigInt` rational arithmetic. It supports basic matrix operations, REF/RREF traces, linear systems, fundamental subspaces, PLU decomposition, and exact characteristic polynomials.

The Vue 3 interface provides responsive light/dark themes, MathJax output, LaTeX copying, and focused or batch row-operation browsing with before/after matrix comparison.

## Quick start

```bash
npm install
npm run dev
```

Quality checks:

```bash
npm run typecheck
npm test
npm run verify:python  # optional, requires Python 3.10+
npm run build
```

See the Chinese sections above for architecture, input rules, verification strategy, and current limitations.
