<script setup lang="ts">
import Button from "primevue/button";
import Message from "primevue/message";
import Tag from "primevue/tag";
import { Check, Clipboard, ClipboardCheck, Sigma, TriangleAlert } from "lucide-vue-next";
import type { CalculationResult } from "../ui/types";
import FormulaBlock from "./FormulaBlock.vue";
import TracePanel from "./TracePanel.vue";

const props = defineProps<{
  result: CalculationResult | null;
  error: string;
  copyState: "idle" | "copied" | "failed";
}>();

defineEmits<{ copy: [] }>();
</script>

<template>
  <section id="result-section" class="result-section" aria-labelledby="result-title" aria-live="polite">
    <div class="section-kicker"><span>02</span> RESULT</div>

    <Message v-if="error" severity="error" :closable="false" class="result-error-message">
      <template #icon><TriangleAlert :size="20" /></template>
      <div><strong>无法完成计算</strong><span>{{ error }}</span></div>
    </Message>

    <div v-if="result" class="result-surface">
      <header class="result-surface__header">
        <div>
          <div class="result-surface__status">
            <span :class="['status-dot', { 'status-dot--warning': result.tone === 'warning' }]" />
            {{ result.tone === 'warning' ? '需要注意' : '计算完成' }}
          </div>
          <h2 id="result-title">{{ result.title }}</h2>
          <p>{{ result.summary }}</p>
        </div>
        <div class="result-surface__actions">
          <Tag value="Exact" severity="secondary" rounded>
            <template #icon><Check :size="13" /></template>
          </Tag>
          <Button severity="secondary" outlined @click="$emit('copy')">
            <ClipboardCheck v-if="copyState === 'copied'" :size="16" />
            <Clipboard v-else :size="16" />
            <span>{{ copyState === 'copied' ? '已复制' : copyState === 'failed' ? '复制失败' : '复制 LaTeX 源码' }}</span>
          </Button>
        </div>
      </header>

      <div class="result-surface__body">
        <section class="result-primary" aria-labelledby="exact-result-title">
          <div class="result-block-label"><Sigma :size="15" /><span id="exact-result-title">精确结果</span></div>
          <div class="formula-stage"><FormulaBlock :latex="result.formula" /></div>
        </section>

        <section v-if="result.trace" class="result-derivation" aria-label="推导步骤">
          <TracePanel :trace="result.trace" />
        </section>
      </div>
    </div>

    <div v-else-if="!error" class="result-empty">
      <div class="result-empty__mark" aria-hidden="true"><span>[</span><Sigma :size="34" /><span>]</span></div>
      <h2 id="result-title">等待一次计算</h2>
      <p>选择运算并输入矩阵，精确结果、公式与推导步骤会在这里展开。</p>
      <div class="result-empty__facts"><span>无浮点误差</span><i /><span>本地计算</span><i /><span>可复制 LaTeX</span></div>
    </div>
  </section>
</template>
