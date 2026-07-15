import type { Matrix } from "../core";
import type { RowOperation } from "../algorithms";

export type Operation =
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

export interface OperationOption {
  readonly value: Operation;
  readonly label: string;
  readonly notation: string;
  readonly description: string;
  readonly requiresRight: boolean;
  readonly requiresExponent?: boolean;
}

export interface OperationGroup {
  readonly label: string;
  readonly items: readonly OperationOption[];
}

export const OPERATION_GROUPS: readonly OperationGroup[] = [
  {
    label: "基础运算",
    items: [
      { value: "add", label: "矩阵加法", notation: "A + B", description: "对应元素逐项相加", requiresRight: true },
      { value: "sub", label: "矩阵减法", notation: "A - B", description: "对应元素逐项相减", requiresRight: true },
      { value: "mul", label: "矩阵乘法", notation: "A × B", description: "计算行向量与列向量的内积", requiresRight: true },
      { value: "transpose", label: "转置", notation: "Aᵀ", description: "交换矩阵的行与列", requiresRight: false },
      { value: "trace", label: "迹", notation: "tr(A)", description: "求主对角线元素之和", requiresRight: false },
      { value: "pow", label: "整数幂", notation: "Aⁿ", description: "支持零次幂与可逆矩阵的负整数幂", requiresRight: false, requiresExponent: true },
    ],
  },
  {
    label: "消元与方程",
    items: [
      { value: "solve", label: "解线性方程组", notation: "Ax = b", description: "判断唯一解、无穷多解或无解", requiresRight: true },
      { value: "ref", label: "行阶梯形", notation: "REF(A)", description: "高斯消元并展示每一步行变换", requiresRight: false },
      { value: "rref", label: "行最简形", notation: "RREF(A)", description: "Gauss–Jordan 消元与完整步骤", requiresRight: false },
      { value: "rref_aug", label: "增广矩阵行最简形", notation: "RREF(A|B)", description: "对增广矩阵执行行最简化", requiresRight: true },
      { value: "rank", label: "秩", notation: "rank(A)", description: "计算线性无关行或列的数量", requiresRight: false },
    ],
  },
  {
    label: "方阵与分解",
    items: [
      { value: "det", label: "行列式", notation: "det(A)", description: "使用 Bareiss 消元保持精确性", requiresRight: false },
      { value: "inv", label: "逆矩阵", notation: "A⁻¹", description: "通过增广矩阵消元求逆并展示步骤", requiresRight: false },
      { value: "adj", label: "伴随矩阵", notation: "adj(A)", description: "支持可逆与奇异矩阵", requiresRight: false },
      { value: "plu", label: "PLU 分解", notation: "PA = LU", description: "分解为置换、下三角与上三角矩阵", requiresRight: false },
      { value: "charpoly", label: "特征多项式", notation: "χₐ(λ)", description: "精确计算 det(λI − A)", requiresRight: false },
    ],
  },
  {
    label: "基本子空间",
    items: [
      { value: "nullspace", label: "零空间", notation: "ker(A)", description: "给出零空间的一组基", requiresRight: false },
      { value: "colspace", label: "列空间", notation: "Col(A)", description: "从原矩阵主元列中提取一组基", requiresRight: false },
      { value: "rowspace", label: "行空间", notation: "Row(A)", description: "从行最简形中提取一组基", requiresRight: false },
    ],
  },
] as const;

export const OPERATION_OPTIONS = OPERATION_GROUPS.flatMap((group) => group.items);

export function getOperationOption(operation: Operation): OperationOption {
  const option = OPERATION_OPTIONS.find((candidate) => candidate.value === operation);
  if (option === undefined) throw new Error(`未知运算：${operation}`);
  return option;
}

export interface TraceDisplay {
  readonly initial: Matrix;
  readonly operations: readonly RowOperation[];
  readonly splitAfter?: number;
  readonly truncated: boolean;
}

export interface CalculationResult {
  readonly tone: "success" | "warning";
  readonly title: string;
  readonly summary: string;
  readonly formula: string;
  readonly latex: string;
  readonly trace?: TraceDisplay;
}

export interface CalculationInput {
  readonly operation: Operation;
  readonly leftText: string;
  readonly rightText: string;
  readonly exponentText: string;
}

export interface CalculatorExample {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly operation: Operation;
  readonly leftText: string;
  readonly rightText: string;
  readonly exponentText?: string;
}
