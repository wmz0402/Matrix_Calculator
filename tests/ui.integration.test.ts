// @vitest-environment jsdom

import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import PrimeVue from "primevue/config";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../src/App.vue";
import FormulaBlock from "../src/components/FormulaBlock.vue";

let wrapper: VueWrapper | undefined;

async function mountApplication(): Promise<VueWrapper> {
  wrapper = mount(App, {
    attachTo: document.body,
    global: {
      plugins: [[PrimeVue, { unstyled: true }]],
      directives: {
        tooltip: {},
      },
    },
  });
  await flushPromises();
  return wrapper;
}

async function runCalculation(app: VueWrapper): Promise<void> {
  await app.find(".calculate-button").trigger("click");
  await flushPromises();
}

describe("Vue browser UI integration", () => {
  beforeEach(() => {
    class ResizeObserverMock {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    }

    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    );
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    Object.defineProperty(window.HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });
    window.MathJax = {};
    window.localStorage.clear();
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    document.body.replaceChildren();
    document.documentElement.classList.remove("app-dark", "blueprint-mode");
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("mounts the complete matrix workspace", async () => {
    const app = await mountApplication();
    expect(app.find(".brand__text").text()).toContain("矩阵研习室");
    expect(app.findAll(".matrix-editor")).toHaveLength(2);
    expect(app.find(".operation-panel").exists()).toBe(true);
    expect(app.find(".result-empty").exists()).toBe(true);
  });

  it("solves the default example and renders exactly three variables", async () => {
    const app = await mountApplication();
    await runCalculation(app);

    expect(app.find(".result-surface h2").text()).toBe("方程组有唯一解");
    const cells = app
      .find(".matrix-result-card")
      .findAll(".matrix-table td")
      .map((cell) => cell.text());
    expect(cells).toEqual(["2", "3", "-1"]);
    expect(app.text()).toContain("推导步骤");
  });

  it("loads the inverse example and disables matrix B", async () => {
    const app = await mountApplication();
    const inverseExample = app.findAll(".example-chip")[1];
    expect(inverseExample).toBeDefined();
    await inverseExample!.trigger("click");

    const textareas = app.findAll("textarea");
    expect(textareas[0]?.element.value).toContain("2 1 0");
    expect(textareas[1]?.attributes("disabled")).toBeDefined();

    await runCalculation(app);
    expect(app.find(".result-surface h2").text()).toBe("逆矩阵");
  });

  it("shows a clear validation error for an empty matrix", async () => {
    const app = await mountApplication();
    const left = app.findAll("textarea")[0];
    expect(left).toBeDefined();
    await left!.setValue("");
    await runCalculation(app);
    expect(app.find(".result-error-message").text()).toContain("矩阵不能为空");
  });

  it("toggles and persists dark mode", async () => {
    const app = await mountApplication();
    const themeButton = app.find('button[aria-label="切换颜色主题"]');
    await themeButton.trigger("click");
    expect(document.documentElement.classList.contains("app-dark")).toBe(true);
    expect(window.localStorage.getItem("matrix-calculator-theme")).toBe("dark");
  });

  it("reveals blueprint mode after three signature clicks and restores after five seconds", async () => {
    vi.useFakeTimers();
    const app = await mountApplication();
    const signature = app.find(".footer-signature");

    await signature.trigger("click");
    await signature.trigger("click");
    expect(document.documentElement.classList.contains("blueprint-mode")).toBe(false);

    await signature.trigger("click");
    expect(document.documentElement.classList.contains("blueprint-mode")).toBe(true);
    expect(app.find(".blueprint-indicator").text()).toContain("BLUEPRINT MODE");

    vi.advanceTimersByTime(5_000);
    await flushPromises();
    expect(document.documentElement.classList.contains("blueprint-mode")).toBe(false);
    expect(app.find(".blueprint-indicator").exists()).toBe(false);
  });

  it("retypesets a changed formula without nesting MathJax output", async () => {
    const typesetClear = vi.fn();
    const typesetPromise = vi.fn(async (elements?: HTMLElement[]) => {
      const element = elements?.[0];
      if (element === undefined) return;
      const rendered = document.createElement("span");
      rendered.className = "MathJax";
      rendered.dataset.source = element.textContent ?? "";
      element.replaceChildren(rendered);
    });
    window.MathJax = { typesetClear, typesetPromise };

    const formula = mount(FormulaBlock, { props: { latex: "A" } });
    await flushPromises();
    await formula.setProps({ latex: "B" });
    await flushPromises();

    const host = formula.find(".formula-block").element;
    expect(typesetClear).toHaveBeenCalledTimes(2);
    expect(typesetPromise).toHaveBeenCalledTimes(2);
    expect(host.querySelectorAll(".MathJax")).toHaveLength(1);
    expect(host.querySelector(".MathJax .MathJax")).toBeNull();
    expect((host.querySelector(".MathJax") as HTMLElement).dataset.source).toBe("\\[B\\]");
    formula.unmount();
  });
});
