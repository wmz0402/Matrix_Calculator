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
- Markdown + LaTeX 结果展示和 LaTeX 复制

伴随矩阵支持奇异矩阵。对于无穷多解，结果会给出一个特解和零空间基；基向量默认按列排列。

## 本地运行

需要 Node.js 20 或更高版本。

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

## 架构

```text
src/
  core/          Rational、Matrix、输入解析和结构化错误
  algorithms/    基础运算、消元、求解、子空间、PLU 等
  format/        LaTeX 格式化
  ui/            当前 DOM 结果适配层
  main.ts        页面控制器
tests/           单元、性质和页面集成测试
scripts/         Python 独立数学校验器
```

数学模块不依赖 DOM。以后迁移 React、Vue 或其他前端框架时，可以保留整个 `core` 和 `algorithms` 层。

行变换记录存储为 `swap`、`scale` 和 `addMultiple` 事件，而不是中文字符串或每一步的完整矩阵副本。UI 可以按需回放这些事件并渲染步骤。

## 正确性验证

运行 TypeScript 类型检查和 Vitest 测试：

```bash
npm run typecheck
npm test
```

测试包括固定用例、边界条件、随机性质测试和页面控件集成测试，验证内容包括：

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
- MathJax 仍由 CDN 加载。离线时表格结果和 LaTeX 文本可用，但公式预览可能不可用。

---

# Matrix Calculator (Exact Rational Arithmetic)

A frontend-only matrix calculator backed by exact `BigInt` rational arithmetic. It supports basic matrix operations, REF/RREF traces, linear systems, fundamental subspaces, PLU decomposition, and exact characteristic polynomials.

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
