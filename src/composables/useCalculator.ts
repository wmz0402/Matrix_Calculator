import { computed, nextTick, ref, shallowRef } from "vue";
import { parseMatrix } from "../core";
import { calculate } from "../ui/calculator";
import { CALCULATOR_EXAMPLES } from "../ui/examples";
import { getOperationOption, type CalculationResult, type CalculatorExample, type Operation } from "../ui/types";

function matrixDimensions(text: string): string {
  if (text.trim().length === 0) return "未输入";
  try {
    const matrix = parseMatrix(text);
    return `${matrix.rows} × ${matrix.cols}`;
  } catch {
    return "格式未完成";
  }
}

export function useCalculator() {
  const firstExample = CALCULATOR_EXAMPLES[0];
  if (firstExample === undefined) throw new Error("缺少计算示例");

  const leftText = ref(firstExample.leftText);
  const rightText = ref(firstExample.rightText);
  const exponentText = ref(firstExample.exponentText ?? "2");
  const operation = ref<Operation>(firstExample.operation);
  const result = shallowRef<CalculationResult | null>(null);
  const errorMessage = ref("");
  const isComputing = ref(false);
  const copyState = ref<"idle" | "copied" | "failed">("idle");

  const selectedOperation = computed(() => getOperationOption(operation.value));
  const requiresRight = computed(() => selectedOperation.value.requiresRight);
  const requiresExponent = computed(() => selectedOperation.value.requiresExponent === true);
  const leftDimensions = computed(() => matrixDimensions(leftText.value));
  const rightDimensions = computed(() => matrixDimensions(rightText.value));

  async function runCalculation(): Promise<void> {
    isComputing.value = true;
    errorMessage.value = "";
    copyState.value = "idle";
    await nextTick();
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
    try {
      result.value = calculate({
        operation: operation.value,
        leftText: leftText.value,
        rightText: rightText.value,
        exponentText: exponentText.value,
      });
    } catch (error) {
      result.value = null;
      errorMessage.value = error instanceof Error ? error.message : String(error);
    } finally {
      isComputing.value = false;
    }
  }

  function loadExample(example: CalculatorExample): void {
    leftText.value = example.leftText;
    rightText.value = example.rightText;
    exponentText.value = example.exponentText ?? "2";
    operation.value = example.operation;
    result.value = null;
    errorMessage.value = "";
    copyState.value = "idle";
  }

  function swapMatrices(): void {
    [leftText.value, rightText.value] = [rightText.value, leftText.value];
    result.value = null;
    errorMessage.value = "";
  }

  function clearInputs(): void {
    leftText.value = "";
    rightText.value = "";
    result.value = null;
    errorMessage.value = "";
    copyState.value = "idle";
  }

  async function copyLatex(): Promise<void> {
    const latex = result.value?.latex;
    if (!latex) return;
    try {
      await navigator.clipboard.writeText(latex);
      copyState.value = "copied";
    } catch {
      copyState.value = "failed";
    }
    window.setTimeout(() => {
      copyState.value = "idle";
    }, 2_200);
  }

  return {
    leftText,
    rightText,
    exponentText,
    operation,
    result,
    errorMessage,
    isComputing,
    copyState,
    selectedOperation,
    requiresRight,
    requiresExponent,
    leftDimensions,
    rightDimensions,
    runCalculation,
    loadExample,
    swapMatrices,
    clearInputs,
    copyLatex,
  };
}
