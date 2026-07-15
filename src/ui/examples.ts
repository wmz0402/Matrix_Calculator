import type { CalculatorExample } from "./types";

export const CALCULATOR_EXAMPLES: readonly CalculatorExample[] = [
  {
    id: "solve",
    label: "三元方程组",
    description: "唯一解与完整消元过程",
    operation: "solve",
    leftText: "2 1 -1\n-3 -1 2\n-2 1 2",
    rightText: "8\n-11\n-3",
  },
  {
    id: "inverse",
    label: "精确逆矩阵",
    description: "结果含分数，不产生舍入误差",
    operation: "inv",
    leftText: "2 1 0\n1 2 1\n0 1 2",
    rightText: "",
  },
  {
    id: "rref",
    label: "观察 RREF",
    description: "含相关行与自由变量",
    operation: "rref",
    leftText: "1 2 3 4\n2 4 7 10\n-1 -2 -2 -2",
    rightText: "",
  },
  {
    id: "plu",
    label: "PLU 分解",
    description: "观察置换与三角矩阵",
    operation: "plu",
    leftText: "0 2 1\n1 1 0\n2 1 1",
    rightText: "",
  },
] as const;
