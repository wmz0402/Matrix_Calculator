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
} from "./algorithms";
import { Matrix, parseMatrix, Rational } from "./core";
import { augmentedMatrixToLatex, matrixToLatex, polynomialToLatex } from "./format/latex";
import { ResultView } from "./ui/result-view";

type Operation =
  | "add"
  | "sub"
  | "mul"
  | "transpose"
  | "trace"
  | "det"
  | "inv"
  | "adj"
  | "rank"
  | "ref"
  | "rref"
  | "rref_aug"
  | "pow"
  | "solve"
  | "nullspace"
  | "colspace"
  | "rowspace"
  | "plu"
  | "charpoly";

function requiredElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLElement)) throw new Error(`缺少页面元素 #${id}`);
  return element as T;
}

const operationSelect = requiredElement<HTMLSelectElement>("operation");
const matrixAInput = requiredElement<HTMLTextAreaElement>("matrixA");
const matrixBInput = requiredElement<HTMLTextAreaElement>("matrixB");
const matrixBWrap = requiredElement<HTMLDivElement>("matrixBWrap");
const powerWrap = requiredElement<HTMLDivElement>("powerWrap");
const powerInput = requiredElement<HTMLInputElement>("power");
const computeButton = requiredElement<HTMLButtonElement>("compute");
const copyButton = requiredElement<HTMLButtonElement>("copyLatex");
const resultView = new ResultView();

const BINARY_OPERATIONS = new Set<Operation>(["add", "sub", "mul", "rref_aug", "solve"]);

function currentOperation(): Operation {
  return operationSelect.value as Operation;
}

function updateControls(): void {
  const operation = currentOperation();
  powerWrap.hidden = operation !== "pow";
  const needsRightMatrix = BINARY_OPERATIONS.has(operation);
  matrixBWrap.classList.toggle("field-muted", !needsRightMatrix);
  matrixBInput.disabled = !needsRightMatrix;
}

function requireRightMatrix(): Matrix {
  if (matrixBInput.value.trim().length === 0) throw new Error("需要输入矩阵 B（或向量 b）");
  return parseMatrix(matrixBInput.value);
}

function showBasis(
  name: string,
  symbol: string,
  result: { readonly basis: Matrix; readonly dimension: number },
): void {
  if (result.dimension === 0) {
    resultView.show({
      summary: `${name}的维数为 0，基为空`,
      markdown: `**${name}**\n\n$$\n${symbol} = \\{0\\}\n$$`,
      latex: `\\[\n${symbol} = \\{0\\}\n\\]`,
    });
    return;
  }
  const basisLatex = matrixToLatex(result.basis);
  resultView.show({
    summary: `${name}的维数为 ${result.dimension}；基向量按列排列`,
    matrices: [{ caption: "基矩阵（每列一个基向量）", matrix: result.basis }],
    markdown: `**${name}的一组基**\n\n$$\n${symbol} = \\operatorname{span}\\left\\{\\text{矩阵各列}\\right\\},\\quad \\dim=${result.dimension}\n$$\n\n$$\n${basisLatex}\n$$`,
    latex: `\\[\n${symbol} = \\operatorname{ColSpan}\\left(${basisLatex}\\right),\\quad \\dim=${result.dimension}\n\\]`,
  });
}

function compute(): void {
  try {
    const operation = currentOperation();
    const left = parseMatrix(matrixAInput.value);

    if (operation === "add") {
      resultView.showMatrix("矩阵加法", add(left, requireRightMatrix()), "A + B");
      return;
    }
    if (operation === "sub") {
      resultView.showMatrix("矩阵减法", subtract(left, requireRightMatrix()), "A - B");
      return;
    }
    if (operation === "mul") {
      resultView.showMatrix("矩阵乘法", multiply(left, requireRightMatrix()), "A \\times B");
      return;
    }
    if (operation === "transpose") {
      resultView.showMatrix("转置", transpose(left), "A^T");
      return;
    }
    if (operation === "trace") {
      resultView.showScalar("矩阵的迹", trace(left), "\\operatorname{tr}(A)");
      return;
    }
    if (operation === "det") {
      resultView.showScalar("行列式", determinant(left), "\\det(A)");
      return;
    }
    if (operation === "inv") {
      const result = inverse(left, { trace: true });
      resultView.showMatrix("逆矩阵", result.inverse, "A^{-1}");
      resultView.appendTrace(
        left.augment(Matrix.identity(left.rows)),
        result.operations,
        left.cols,
        result.traceTruncated,
      );
      return;
    }
    if (operation === "adj") {
      resultView.showMatrix("伴随矩阵", adjugate(left), "\\operatorname{adj}(A)");
      return;
    }
    if (operation === "rank") {
      const value = rank(left);
      resultView.showScalar("矩阵的秩", Rational.fromInteger(value), "\\operatorname{rank}(A)");
      return;
    }
    if (operation === "ref" || operation === "rref") {
      const result = eliminate(left, { form: operation, trace: true });
      const label = operation === "ref" ? "REF(A)" : "RREF(A)";
      resultView.showMatrix(operation === "ref" ? "行阶梯形" : "行最简形", result.matrix, label);
      resultView.appendTrace(left, result.operations, undefined, result.traceTruncated);
      return;
    }
    if (operation === "rref_aug") {
      const right = requireRightMatrix();
      const augmented = left.augment(right);
      const result = eliminate(augmented, { form: "rref", trace: true });
      const latex = augmentedMatrixToLatex(result.matrix, left.cols);
      resultView.show({
        summary: "增广矩阵的行最简形",
        matrices: [{ caption: "RREF(A|B)", matrix: result.matrix, splitAfter: left.cols }],
        markdown: `**结果**\n\n$$\n\\operatorname{RREF}(A|B) = ${latex}\n$$`,
        latex: `\\[\n\\operatorname{RREF}(A|B) = ${latex}\n\\]`,
      });
      resultView.appendTrace(augmented, result.operations, left.cols, result.traceTruncated);
      return;
    }
    if (operation === "pow") {
      const rawExponent = powerInput.value.trim();
      if (rawExponent.length === 0) throw new Error("幂不能为空");
      const exponent = Number(rawExponent);
      resultView.showMatrix(`矩阵的 ${exponent} 次幂`, power(left, exponent), `A^{${exponent}}`);
      return;
    }
    if (operation === "solve") {
      const right = requireRightMatrix();
      const result = solve(left, right, { trace: true });
      const augmented = left.augment(right);
      if (result.kind === "unique") {
        resultView.showMatrix("方程组有唯一解", result.solution, right.cols === 1 ? "x" : "X");
      } else if (result.kind === "inconsistent") {
        const columns = result.inconsistentRightHandSides.map((index) => index + 1).join("、");
        resultView.show({
          summary: `方程组不相容；右端第 ${columns} 列无解`,
          markdown: `**方程组无解**\n\n增广矩阵中出现了系数全为零、右端非零的矛盾行。`,
          latex: "\\[\\text{方程组不相容，无解。}\\]",
        });
      } else {
        const particularLatex = matrixToLatex(result.particular);
        const basisLatex = matrixToLatex(result.nullSpaceBasis);
        const unknown = right.cols === 1 ? "x" : "X";
        const parameter = right.cols === 1 ? "t" : "C";
        resultView.show({
          summary: `方程组有无穷多解；${result.freeColumns.length} 个自由变量`,
          matrices: [
            { caption: "一个特解", matrix: result.particular },
            { caption: "零空间基（按列排列）", matrix: result.nullSpaceBasis },
          ],
          markdown: `**参数化解**\n\n$$\n${unknown} = ${particularLatex} + ${basisLatex}${parameter}\n$$`,
          latex: `\\[\n${unknown} = ${particularLatex} + ${basisLatex}${parameter}\n\\]`,
        });
      }
      resultView.appendTrace(augmented, result.operations, left.cols, result.traceTruncated);
      return;
    }
    if (operation === "nullspace") {
      showBasis("零空间", "\\ker(A)", nullSpace(left));
      return;
    }
    if (operation === "colspace") {
      showBasis("列空间", "\\operatorname{Col}(A)", columnSpace(left));
      return;
    }
    if (operation === "rowspace") {
      const result = rowSpace(left);
      if (result.dimension === 0) {
        showBasis("行空间", "\\operatorname{Row}(A)", result);
      } else {
        const basisLatex = matrixToLatex(result.basis);
        resultView.show({
          summary: `行空间的维数为 ${result.dimension}；基向量按行排列`,
          matrices: [{ caption: "行空间基（每行一个基向量）", matrix: result.basis }],
          markdown: `**行空间的一组基**\n\n$$\n${basisLatex},\\quad \\dim\\operatorname{Row}(A)=${result.dimension}\n$$`,
          latex: `\\[\n${basisLatex},\\quad \\dim\\operatorname{Row}(A)=${result.dimension}\n\\]`,
        });
      }
      return;
    }
    if (operation === "plu") {
      const result = plu(left);
      const p = matrixToLatex(result.permutation);
      const l = matrixToLatex(result.lower);
      const u = matrixToLatex(result.upper);
      resultView.show({
        summary: `PLU 分解${result.singular ? "（矩阵奇异）" : ""}，满足 PA = LU`,
        matrices: [
          { caption: "置换矩阵 P", matrix: result.permutation },
          { caption: "下三角矩阵 L", matrix: result.lower },
          { caption: "上三角矩阵 U", matrix: result.upper },
        ],
        markdown: `**PLU 分解**\n\n$$\nP=${p},\\quad L=${l},\\quad U=${u}\n$$\n\n$$PA=LU$$`,
        latex: `\\[\nP=${p},\\quad L=${l},\\quad U=${u},\\qquad PA=LU\n\\]`,
      });
      return;
    }
    if (operation === "charpoly") {
      const polynomial = polynomialToLatex(characteristicPolynomial(left));
      resultView.show({
        summary: "特征多项式（保持有理数精确性）",
        markdown: `**特征多项式**\n\n$$\n\\chi_A(\\lambda)=\\det(\\lambda I-A)=${polynomial}\n$$`,
        latex: `\\[\n\\chi_A(\\lambda)=\\det(\\lambda I-A)=${polynomial}\n\\]`,
      });
    }
  } catch (error) {
    resultView.showError(error);
  }
}

operationSelect.addEventListener("change", updateControls);
computeButton.addEventListener("click", compute);
copyButton.addEventListener("click", () => void resultView.copyLatex());
updateControls();
