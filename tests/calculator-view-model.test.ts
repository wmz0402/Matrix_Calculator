import { describe, expect, it } from "vitest";
import { calculate } from "../src/ui/calculator";

describe("calculator view model", () => {
  it("formats a scalar determinant result", () => {
    const result = calculate({ operation: "det", leftText: "1 2; 3 4", rightText: "", exponentText: "2" });
    expect(result.title).toBe("行列式");
    expect(result.formula).toContain("-2");
    expect(result.matrices).toHaveLength(0);
  });

  it("keeps inverse trace data separate from presentation", () => {
    const result = calculate({ operation: "inv", leftText: "1 2; 3 4", rightText: "", exponentText: "2" });
    expect(result.matrices[0]?.matrix.rows).toBe(2);
    expect(result.trace?.initial.cols).toBe(4);
    expect(result.trace?.operations.length).toBeGreaterThan(0);
  });

  it("describes infinite solutions with a particular solution and basis", () => {
    const result = calculate({ operation: "solve", leftText: "1 2 3; 2 4 6", rightText: "4; 8", exponentText: "2" });
    expect(result.title).toBe("方程组有无穷多解");
    expect(result.matrices).toHaveLength(2);
    expect(result.summary).toContain("2 个自由变量");
  });

  it("formats the characteristic polynomial", () => {
    const result = calculate({ operation: "charpoly", leftText: "1 2; 3 4", rightText: "", exponentText: "2" });
    expect(result.formula).toContain("\\lambda^{2} - 5\\lambda - 2");
  });
});
