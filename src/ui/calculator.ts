import {
  add,
  adjugate,
  characteristicPolynomial,
  columnSpace,
  determinant,
  eliminate,
  inverse,
  multiply,
  nullSpace,
  plu,
  power,
  rank,
  rowSpace,
  solve,
  subtract,
  trace,
  transpose,
} from "../algorithms";
import { Matrix, parseMatrix, Rational } from "../core";
import { augmentedMatrixToLatex, matrixToLatex, polynomialToLatex, rationalToLatex } from "../format/latex";
import type { CalculationInput, CalculationResult, MatrixDisplay } from "./types";

function requireRightMatrix(text: string): Matrix {
  if (text.trim().length === 0) throw new Error("当前运算需要矩阵 B（或向量 b）");
  return parseMatrix(text);
}

function matrixResult(
  title: string,
  summary: string,
  matrix: Matrix,
  expression: string,
  splitAfter?: number,
): CalculationResult {
  const rendered = splitAfter === undefined ? matrixToLatex(matrix) : augmentedMatrixToLatex(matrix, splitAfter);
  return {
    tone: "success",
    title,
    summary,
    formula: `${expression} = ${rendered}`,
    latex: `\\[\n${expression} = ${rendered}\n\\]`,
    matrices: [{ caption: "计算结果", matrix, splitAfter }],
  };
}

function scalarResult(title: string, value: Rational, expression: string): CalculationResult {
  const rendered = rationalToLatex(value);
  return {
    tone: "success",
    title,
    summary: `精确值为 ${value.toString()}`,
    formula: `${expression} = ${rendered}`,
    latex: `\\[\n${expression} = ${rendered}\n\\]`,
    matrices: [],
  };
}

function basisResult(
  title: string,
  symbol: string,
  result: { readonly basis: Matrix; readonly dimension: number },
  vectorsByRow = false,
): CalculationResult {
  if (result.dimension === 0) {
    return {
      tone: "success",
      title,
      summary: "维数为 0，基为空",
      formula: `${symbol} = \\{0\\}`,
      latex: `\\[\n${symbol} = \\{0\\}\n\\]`,
      matrices: [],
    };
  }
  const rendered = matrixToLatex(result.basis);
  const layout = vectorsByRow ? "每行一个基向量" : "每列一个基向量";
  return {
    tone: "success",
    title,
    summary: `维数为 ${result.dimension}，${layout}`,
    formula: `${symbol} = \\operatorname{span}\\left(${rendered}\\right),\\quad \\dim=${result.dimension}`,
    latex: `\\[\n${symbol} = \\operatorname{span}\\left(${rendered}\\right),\\quad \\dim=${result.dimension}\n\\]`,
    matrices: [{ caption: `${title}基矩阵 · ${layout}`, matrix: result.basis }],
  };
}

export function calculate(input: CalculationInput): CalculationResult {
  const left = parseMatrix(input.leftText);
  const { operation } = input;

  if (operation === "add") return matrixResult("矩阵加法", "两个同型矩阵逐项相加", add(left, requireRightMatrix(input.rightText)), "A + B");
  if (operation === "sub") return matrixResult("矩阵减法", "两个同型矩阵逐项相减", subtract(left, requireRightMatrix(input.rightText)), "A - B");
  if (operation === "mul") return matrixResult("矩阵乘法", "按行与列的内积得到乘积矩阵", multiply(left, requireRightMatrix(input.rightText)), "A \\times B");
  if (operation === "transpose") return matrixResult("转置", "矩阵的行与列已交换", transpose(left), "A^T");
  if (operation === "trace") return scalarResult("矩阵的迹", trace(left), "\\operatorname{tr}(A)");
  if (operation === "det") return scalarResult("行列式", determinant(left), "\\det(A)");
  if (operation === "adj") return matrixResult("伴随矩阵", "由代数余子式转置构成", adjugate(left), "\\operatorname{adj}(A)");
  if (operation === "rank") return scalarResult("矩阵的秩", Rational.fromInteger(rank(left)), "\\operatorname{rank}(A)");

  if (operation === "inv") {
    const result = inverse(left, { trace: true });
    return {
      ...matrixResult("逆矩阵", "通过增广矩阵 [A | I] 的行变换求得", result.inverse, "A^{-1}"),
      trace: {
        initial: left.augment(Matrix.identity(left.rows)),
        operations: result.operations,
        splitAfter: left.cols,
        truncated: result.traceTruncated,
      },
    };
  }

  if (operation === "ref" || operation === "rref") {
    const result = eliminate(left, { form: operation, trace: true });
    const expression = operation === "ref" ? "\\operatorname{REF}(A)" : "\\operatorname{RREF}(A)";
    return {
      ...matrixResult(
        operation === "ref" ? "行阶梯形" : "行最简形",
        `找到 ${result.rank} 个主元列`,
        result.matrix,
        expression,
      ),
      trace: {
        initial: left,
        operations: result.operations,
        truncated: result.traceTruncated,
      },
    };
  }

  if (operation === "rref_aug") {
    const right = requireRightMatrix(input.rightText);
    const augmented = left.augment(right);
    const result = eliminate(augmented, { form: "rref", trace: true });
    const base = matrixResult("增广矩阵行最简形", "分隔线左侧为 A，右侧为 B", result.matrix, "\\operatorname{RREF}(A|B)", left.cols);
    return {
      ...base,
      trace: {
        initial: augmented,
        operations: result.operations,
        splitAfter: left.cols,
        truncated: result.traceTruncated,
      },
    };
  }

  if (operation === "pow") {
    const rawExponent = input.exponentText.trim();
    if (rawExponent.length === 0) throw new Error("请输入整数幂 n");
    const exponent = Number(rawExponent);
    return matrixResult(`矩阵的 ${exponent} 次幂`, "使用快速幂保持计算效率", power(left, exponent), `A^{${exponent}}`);
  }

  if (operation === "solve") {
    const right = requireRightMatrix(input.rightText);
    const result = solve(left, right, { trace: true });
    const augmented = left.augment(right);
    const traceDisplay = {
      initial: augmented,
      operations: result.operations,
      splitAfter: left.cols,
      truncated: result.traceTruncated,
    } as const;
    if (result.kind === "unique") {
      const unknown = right.cols === 1 ? "x" : "X";
      return {
        ...matrixResult("方程组有唯一解", "每个未知量都对应一个主元", result.solution, unknown),
        trace: traceDisplay,
      };
    }
    if (result.kind === "inconsistent") {
      const columns = result.inconsistentRightHandSides.map((index) => index + 1).join("、");
      return {
        tone: "warning",
        title: "方程组不相容",
        summary: `右端第 ${columns} 列出现矛盾行，因此无解`,
        formula: "\\text{系数全为零，而右端项非零}",
        latex: "\\[\\text{方程组不相容，无解。}\\]",
        matrices: [{ caption: "消元后的增广矩阵", matrix: result.rref, splitAfter: left.cols }],
        trace: traceDisplay,
      };
    }
    const particular = matrixToLatex(result.particular);
    const basis = matrixToLatex(result.nullSpaceBasis);
    const unknown = right.cols === 1 ? "x" : "X";
    const parameter = right.cols === 1 ? "t" : "C";
    return {
      tone: "success",
      title: "方程组有无穷多解",
      summary: `${result.freeColumns.length} 个自由变量；通解由一个特解与零空间组成`,
      formula: `${unknown} = ${particular} + ${basis}${parameter}`,
      latex: `\\[\n${unknown} = ${particular} + ${basis}${parameter}\n\\]`,
      matrices: [
        { caption: "一个特解", matrix: result.particular },
        { caption: "零空间基 · 每列一个基向量", matrix: result.nullSpaceBasis },
      ],
      trace: traceDisplay,
    };
  }

  if (operation === "nullspace") return basisResult("零空间", "\\ker(A)", nullSpace(left));
  if (operation === "colspace") return basisResult("列空间", "\\operatorname{Col}(A)", columnSpace(left));
  if (operation === "rowspace") return basisResult("行空间", "\\operatorname{Row}(A)", rowSpace(left), true);

  if (operation === "plu") {
    const result = plu(left);
    const displays: readonly MatrixDisplay[] = [
      { caption: "置换矩阵 P", matrix: result.permutation },
      { caption: "下三角矩阵 L", matrix: result.lower },
      { caption: "上三角矩阵 U", matrix: result.upper },
    ];
    const p = matrixToLatex(result.permutation);
    const l = matrixToLatex(result.lower);
    const u = matrixToLatex(result.upper);
    return {
      tone: result.singular ? "warning" : "success",
      title: "PLU 分解",
      summary: result.singular ? "矩阵奇异，但仍给出满足 PA = LU 的分解" : "分解满足 PA = LU",
      formula: `P=${p},\\quad L=${l},\\quad U=${u}`,
      latex: `\\[\nP=${p},\\quad L=${l},\\quad U=${u},\\qquad PA=LU\n\\]`,
      matrices: displays,
    };
  }

  const polynomial = polynomialToLatex(characteristicPolynomial(left));
  return {
    tone: "success",
    title: "特征多项式",
    summary: "所有系数均保持有理数精确性",
    formula: `\\chi_A(\\lambda)=\\det(\\lambda I-A)=${polynomial}`,
    latex: `\\[\n\\chi_A(\\lambda)=\\det(\\lambda I-A)=${polynomial}\n\\]`,
    matrices: [],
  };
}
