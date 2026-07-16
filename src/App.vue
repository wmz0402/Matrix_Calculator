<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import Button from "primevue/button";
import Tag from "primevue/tag";
import { ArrowUpRight, BookOpen, Github, Grid2X2, Moon, ShieldCheck, Sparkles, Sun } from "lucide-vue-next";
import MatrixEditor from "./components/MatrixEditor.vue";
import OperationPanel from "./components/OperationPanel.vue";
import ResultPanel from "./components/ResultPanel.vue";
import BrandIcon from "./components/BrandIcon.vue";
import { useCalculator } from "./composables/useCalculator";
import { useTheme } from "./composables/useTheme";
import { CALCULATOR_EXAMPLES } from "./ui/examples";

const calculator = useCalculator();
const { theme, toggleTheme } = useTheme();
const blueprintActive = ref(false);
let signatureClicks = 0;
let blueprintTimer: any;

async function calculateAndReveal(): Promise<void> {
  await calculator.runCalculation();
  document.getElementById("result-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function handleShortcut(event: KeyboardEvent): void {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    void calculateAndReveal();
  }
}

function leaveBlueprintMode(): void {
  blueprintActive.value = false;
  document.documentElement.classList.remove("blueprint-mode");
  blueprintTimer = undefined;
}

function handleSignatureClick(): void {
  if (blueprintActive.value) return;

  signatureClicks += 1;
  if (signatureClicks < 3) return;

  signatureClicks = 0;
  blueprintActive.value = true;
  document.documentElement.classList.add("blueprint-mode");
  blueprintTimer = window.setTimeout(leaveBlueprintMode, 5_000);
}

onMounted(() => window.addEventListener("keydown", handleShortcut));
onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleShortcut);
  window.clearTimeout(blueprintTimer);
  document.documentElement.classList.remove("blueprint-mode");
});
</script>

<template>
  <div class="app-shell">
    <div class="ambient ambient--one" />
    <div class="ambient ambient--two" />

    <header class="site-header">
      <a class="brand" href="#" aria-label="矩阵研习室首页">
        <span class="brand__mark" aria-hidden="true"><BrandIcon :size="20" /></span>
        <span class="brand__text"><strong>矩阵研习室</strong></span>
      </a>

      <div class="site-header__actions">
        <Tag value="100% LOCAL" severity="secondary" rounded>
          <template #icon><ShieldCheck :size="13" /></template>
        </Tag>
        <Button v-tooltip.bottom="theme === 'light' ? '切换到深色模式' : '切换到浅色模式'" text rounded severity="secondary" aria-label="切换颜色主题" @click="toggleTheme">
          <Moon v-if="theme === 'light'" :size="19" />
          <Sun v-else :size="19" />
        </Button>
        <Button as="a" href="https://github.com/Dawn6666666/Matrix_Calculator" target="_blank" rel="noreferrer" text rounded severity="secondary" aria-label="查看 GitHub 仓库">
          <Github :size="19" />
        </Button>
      </div>
    </header>

    <main class="main-content">
      <section class="hero-section">
        <div class="hero-section__copy">
          <div class="hero-section__eyebrow"><Sparkles :size="15" /> EXACT LINEAR ALGEBRA</div>
          <h1>矩阵有序，<br />推演<em>有迹。</em></h1>
          <p>面向线性代数学习的精确计算工具，保留分数与完整推导过程。</p>
        </div>
        <div class="hero-section__proof" aria-label="产品特点">
          <div><strong>19</strong><span>种常用运算</span></div>
          <div><strong>0</strong><span>浮点舍入误差</span></div>
          <div><strong>∞</strong><span>位整数精度</span></div>
        </div>
      </section>

      <section class="examples-strip" aria-labelledby="examples-title">
        <div class="examples-strip__title"><BookOpen :size="17" /><span id="examples-title">从一个例题开始</span></div>
        <button v-for="example in CALCULATOR_EXAMPLES" :key="example.id" class="example-chip" type="button" @click="calculator.loadExample(example)">
          <span><strong>{{ example.label }}</strong><small>{{ example.description }}</small></span>
          <ArrowUpRight :size="15" />
        </button>
      </section>

      <section class="workspace" aria-labelledby="workspace-title">
        <div class="workspace__topline">
          <div><span>01</span><strong id="workspace-title">WORKSPACE</strong></div>
          <p>数据只停留在你的浏览器中</p>
        </div>

        <div class="workspace__body">
          <div class="matrix-workbench">
            <MatrixEditor
              v-model="calculator.leftText.value"
              symbol="A"
              title="矩阵 A"
              :dimensions="calculator.leftDimensions.value"
              placeholder="1  0  1\n2  1  0\n-3  2  -5"
              @calculate="calculateAndReveal"
            />
            <MatrixEditor
              v-model="calculator.rightText.value"
              symbol="B"
              title="矩阵 B / 向量 b"
              :dimensions="calculator.rightDimensions.value"
              :disabled="!calculator.requiresRight.value"
              placeholder="1\n2\n3"
              @calculate="calculateAndReveal"
            />
          </div>

          <OperationPanel
            v-model:operation="calculator.operation.value"
            v-model:exponent="calculator.exponentText.value"
            :loading="calculator.isComputing.value"
            :can-swap="calculator.requiresRight.value"
            @calculate="calculateAndReveal"
            @swap="calculator.swapMatrices"
            @clear="calculator.clearInputs"
          />
        </div>
      </section>

      <ResultPanel
        :result="calculator.result.value"
        :error="calculator.errorMessage.value"
        :copy-state="calculator.copyState.value"
        @copy="calculator.copyLatex"
      />
    </main>

    <footer class="site-footer">
      <div class="site-footer__brand"><BrandIcon :size="14" /><span>矩阵研习室 · Exact Rational Engine</span></div>
      <button
        v-tooltip.top="'Click 3 times'"
        class="footer-signature"
        type="button"
        aria-label="Code By Dawn，连续点击三次进入蓝图模式"
        @click="handleSignatureClick"
      >
        Code By Dawn
      </button>
      <p>为课堂、作业与自学而做。计算结果仅供学习核验。</p>
    </footer>

    <div v-if="blueprintActive" class="blueprint-indicator" role="status" aria-live="polite">
      <span>BLUEPRINT MODE</span>
      <small>Returning in 5 seconds</small>
    </div>
  </div>
</template>
