<script setup lang="ts">
import { ref, watch } from "vue";
import Button from "primevue/button";
import Message from "primevue/message";
import Tab from "primevue/tab";
import TabList from "primevue/tablist";
import TabPanel from "primevue/tabpanel";
import TabPanels from "primevue/tabpanels";
import Tabs from "primevue/tabs";
import Tag from "primevue/tag";
import { Check, Clipboard, ClipboardCheck, Code2, FlaskConical, Sigma, TriangleAlert } from "lucide-vue-next";
import type { CalculationResult } from "../ui/types";
import FormulaBlock from "./FormulaBlock.vue";
import MatrixTable from "./MatrixTable.vue";
import TracePanel from "./TracePanel.vue";

const props = defineProps<{
  result: CalculationResult | null;
  error: string;
  copyState: "idle" | "copied" | "failed";
}>();

defineEmits<{ copy: [] }>();
const activeTab = ref("result");

watch(
  () => props.result,
  () => {
    activeTab.value = "result";
  },
);
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
            <span>{{ copyState === 'copied' ? '已复制' : copyState === 'failed' ? '复制失败' : '复制 LaTeX' }}</span>
          </Button>
        </div>
      </header>

      <Tabs v-model:value="activeTab" class="result-tabs">
        <TabList>
          <Tab value="result"><Sigma :size="16" />结果</Tab>
          <Tab v-if="result.trace" value="steps"><FlaskConical :size="16" />推导步骤 <span class="tab-count">{{ result.trace.operations.length }}</span></Tab>
          <Tab value="latex"><Code2 :size="16" />LaTeX</Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="result">
            <div class="formula-stage"><FormulaBlock :latex="result.formula" /></div>
            <div v-if="result.matrices.length" :class="['matrix-results-grid', { 'matrix-results-grid--triple': result.matrices.length === 3 }]">
              <article v-for="item in result.matrices" :key="item.caption" class="matrix-result-card">
                <div class="matrix-result-card__head">
                  <span>{{ item.caption }}</span>
                  <small>{{ item.matrix.rows }} × {{ item.matrix.cols }}</small>
                </div>
                <MatrixTable :matrix="item.matrix" :split-after="item.splitAfter" :label="item.caption" />
              </article>
            </div>
          </TabPanel>
          <TabPanel v-if="result.trace" value="steps">
            <TracePanel :trace="result.trace" />
          </TabPanel>
          <TabPanel value="latex">
            <div class="latex-panel">
              <div class="latex-panel__head"><Code2 :size="16" /><span>可直接粘贴到支持 LaTeX 的编辑器</span></div>
              <pre>{{ result.latex }}</pre>
              <Button severity="secondary" outlined @click="$emit('copy')">
                <ClipboardCheck v-if="copyState === 'copied'" :size="16" />
                <Clipboard v-else :size="16" />
                {{ copyState === 'copied' ? '已复制到剪贴板' : '复制完整代码' }}
              </Button>
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>

    <div v-else-if="!error" class="result-empty">
      <div class="result-empty__mark" aria-hidden="true"><span>[</span><Sigma :size="34" /><span>]</span></div>
      <h2 id="result-title">等待一次计算</h2>
      <p>选择运算并输入矩阵，精确结果、公式与推导步骤会在这里展开。</p>
      <div class="result-empty__facts"><span>无浮点误差</span><i /><span>本地计算</span><i /><span>可复制 LaTeX</span></div>
    </div>
  </section>
</template>
