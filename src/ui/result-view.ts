import { materializeTrace, type RowOperation } from "../algorithms/elimination";
import { Matrix } from "../core/matrix";
import {
  augmentedMatrixToLatex,
  matrixToLatex,
  rationalToLatex,
  rowOperationToLatex,
} from "../format/latex";
import { Rational } from "../core/rational";

interface MarkdownRenderer {
  render(text: string): string;
}

interface MathJaxApi {
  typesetPromise?(elements?: HTMLElement[]): Promise<void>;
}

declare global {
  interface Window {
    markdownit?: (options: { html: boolean; breaks: boolean }) => MarkdownRenderer;
    MathJax?: MathJaxApi;
  }
}

interface MatrixDisplay {
  readonly caption: string;
  readonly matrix: Matrix;
  readonly splitAfter?: number;
}

interface ResultContent {
  readonly summary: string;
  readonly matrices?: readonly MatrixDisplay[];
  readonly markdown: string;
  readonly latex: string;
}

function requiredElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLElement)) throw new Error(`缺少页面元素 #${id}`);
  return element as T;
}

function matrixToTable(matrix: Matrix, splitAfter?: number): HTMLTableElement {
  const table = document.createElement("table");
  table.className = "matrix";
  if (matrix.rows === 0 || matrix.cols === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.textContent = "（空基）";
    row.appendChild(cell);
    table.appendChild(row);
    return table;
  }

  for (let row = 0; row < matrix.rows; row += 1) {
    const tableRow = document.createElement("tr");
    for (let col = 0; col < matrix.cols; col += 1) {
      const cell = document.createElement("td");
      cell.textContent = matrix.get(row, col).toString();
      if (splitAfter !== undefined && col === splitAfter) cell.classList.add("split-left");
      tableRow.appendChild(cell);
    }
    table.appendChild(tableRow);
  }
  return table;
}

export class ResultView {
  readonly #body = requiredElement<HTMLDivElement>("resultBody");
  readonly #error = requiredElement<HTMLDivElement>("resultError");
  readonly #render = requiredElement<HTMLDivElement>("resultRender");
  readonly #latexOutput = requiredElement<HTMLPreElement>("latexOutput");
  readonly #hint = requiredElement<HTMLDivElement>("resultHint");
  readonly #markdown = window.markdownit?.({ html: false, breaks: false });
  #lastLatex = "";
  #lastMarkdown = "";

  show(content: ResultContent): void {
    this.#body.replaceChildren();
    this.#error.textContent = "";
    const summary = document.createElement("div");
    summary.className = "result-summary";
    summary.textContent = content.summary;
    this.#body.appendChild(summary);

    for (const item of content.matrices ?? []) {
      const wrapper = document.createElement("div");
      wrapper.className = "matrix-result";
      const caption = document.createElement("div");
      caption.className = "matrix-caption";
      caption.textContent = item.caption;
      wrapper.append(caption, matrixToTable(item.matrix, item.splitAfter));
      this.#body.appendChild(wrapper);
    }

    this.#lastMarkdown = content.markdown;
    this.#lastLatex = content.latex;
    this.#latexOutput.textContent = content.latex;
    this.#renderMarkdown();
  }

  showMatrix(summary: string, matrix: Matrix, expression: string, splitAfter?: number): void {
    const renderedMatrix =
      splitAfter === undefined
        ? matrixToLatex(matrix)
        : augmentedMatrixToLatex(matrix, splitAfter);
    this.show({
      summary,
      matrices: [{ caption: "结果", matrix, splitAfter }],
      markdown: `**${summary}**\n\n$$\n${expression} = ${renderedMatrix}\n$$`,
      latex: `\\[\n${expression} = ${renderedMatrix}\n\\]`,
    });
  }

  showScalar(summary: string, value: Rational, expression: string): void {
    const renderedValue = rationalToLatex(value);
    this.show({
      summary: `${summary}：${value.toString()}`,
      markdown: `**${summary}**\n\n$$\n${expression} = ${renderedValue}\n$$`,
      latex: `\\[\n${expression} = ${renderedValue}\n\\]`,
    });
  }

  appendTrace(
    initial: Matrix,
    operations: readonly RowOperation[],
    splitAfter?: number,
    truncated = false,
  ): void {
    if (operations.length === 0 && !truncated) return;
    const snapshots = materializeTrace(initial, operations);
    let markdown = "\n\n**行变换步骤**\n";
    let latex = "\n\\[\n\\begin{aligned}\n";
    snapshots.forEach(({ operation, matrix }, index) => {
      const renderedMatrix =
        splitAfter === undefined
          ? matrixToLatex(matrix)
          : augmentedMatrixToLatex(matrix, splitAfter);
      const operationLatex = rowOperationToLatex(operation);
      markdown += `\n${index + 1}. $${operationLatex}$\n\n$$\n${renderedMatrix}\n$$\n`;
      latex += `\\text{${index + 1}. } & ${operationLatex} \\\\ \n& ${renderedMatrix} \\\\ \n`;
    });
    if (truncated) {
      markdown += "\n> 步骤记录达到上限；最终计算仍已完成。\n";
      latex += "\\text{步骤记录达到上限；最终计算仍已完成。} \\\\ \n";
    }
    latex += "\\end{aligned}\n\\]";

    this.#lastMarkdown += markdown;
    this.#lastLatex += latex;
    this.#latexOutput.textContent = this.#lastLatex;
    this.#renderMarkdown();
  }

  showError(error: unknown): void {
    this.#body.replaceChildren();
    this.#error.textContent = `错误：${error instanceof Error ? error.message : String(error)}`;
    this.#lastLatex = "";
    this.#lastMarkdown = "";
    this.#latexOutput.textContent = "";
    this.#render.textContent = "";
  }

  async copyLatex(): Promise<void> {
    if (!this.#lastLatex) {
      this.#setHint("当前没有可复制的 LaTeX。", true);
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(this.#lastLatex);
      } else {
        const fallback = document.createElement("textarea");
        fallback.value = this.#lastLatex;
        fallback.style.position = "fixed";
        fallback.style.opacity = "0";
        document.body.appendChild(fallback);
        try {
          fallback.select();
          if (!document.execCommand("copy")) throw new Error("浏览器拒绝复制操作");
        } finally {
          fallback.remove();
        }
      }
      this.#setHint("LaTeX 已复制。", false);
    } catch {
      this.#setHint("复制失败，请从下方文本框手动复制。", true);
    }
  }

  #setHint(message: string, isError: boolean): void {
    this.#hint.textContent = message;
    this.#hint.classList.toggle("copy-error", isError);
    window.setTimeout(() => {
      this.#hint.textContent = "输出以分数形式显示，支持 Markdown + LaTeX 渲染。";
      this.#hint.classList.remove("copy-error");
    }, 2_500);
  }

  #renderMarkdown(): void {
    if (this.#markdown) {
      const html = this.#lastMarkdown
        .split(/(\$\$[\s\S]*?\$\$)/g)
        .map((part) =>
          part.startsWith("$$") && part.endsWith("$$")
            ? `<div class="math-block">${part}</div>`
            : this.#markdown?.render(part) ?? part,
        )
        .join("");
      this.#render.innerHTML = html;
    } else {
      this.#render.textContent = this.#lastMarkdown;
    }
    const typesetting = window.MathJax?.typesetPromise?.([this.#render]);
    void typesetting?.catch(() => {
        this.#hint.textContent = "公式渲染失败，但表格结果和 LaTeX 文本仍可使用。";
      });
  }
}
