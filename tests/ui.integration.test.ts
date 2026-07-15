// @vitest-environment jsdom

import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const indexHtml = readFileSync("index.html", "utf8");
const bodyHtml = /<body>([\s\S]*)<\/body>/i.exec(indexHtml)?.[1];
if (bodyHtml === undefined) throw new Error("index.html 中缺少 body");
const applicationBody = bodyHtml;

function element<T extends HTMLElement>(id: string): T {
  const value = document.getElementById(id);
  if (!(value instanceof HTMLElement)) throw new Error(`缺少 #${id}`);
  return value as T;
}

async function loadApplication(): Promise<void> {
  document.body.innerHTML = applicationBody;
  // 模拟 MathJax 配置已写入，但 CDN 脚本离线未加载的情况。
  window.MathJax = {};
  await import("../src/main");
}

function selectOperation(operation: string): void {
  const select = element<HTMLSelectElement>("operation");
  select.value = operation;
  select.dispatchEvent(new Event("change"));
}

function compute(left: string, right = ""): void {
  element<HTMLTextAreaElement>("matrixA").value = left;
  element<HTMLTextAreaElement>("matrixB").value = right;
  element<HTMLButtonElement>("compute").click();
}

describe("browser UI integration", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("disables B, not A, for unary operations", async () => {
    await loadApplication();
    selectOperation("det");
    expect(element<HTMLTextAreaElement>("matrixA").disabled).toBe(false);
    expect(element<HTMLTextAreaElement>("matrixB").disabled).toBe(true);
    expect(element("matrixBWrap").classList.contains("field-muted")).toBe(true);
  });

  it("computes a determinant through the page controls", async () => {
    await loadApplication();
    selectOperation("det");
    compute("1 2; 3 4");
    expect(element("resultBody").textContent).toContain("行列式：-2");
    expect(element("resultError").textContent).toBe("");
  });

  it("computes the adjugate of a singular matrix through the UI", async () => {
    await loadApplication();
    selectOperation("adj");
    compute("1 2; 2 4");
    const cells = [...document.querySelectorAll(".matrix td")].map((cell) => cell.textContent);
    expect(cells).toEqual(["4", "-2", "-2", "1"]);
  });

  it("renders only the variable count for an overdetermined unique solution", async () => {
    await loadApplication();
    selectOperation("solve");
    compute("1 0; 0 1; 0 0", "2; 3; 0");
    const cells = [...document.querySelectorAll(".matrix td")].map((cell) => cell.textContent);
    expect(cells).toEqual(["2", "3"]);
    expect(element("resultBody").textContent).toContain("方程组有唯一解");
  });
});
