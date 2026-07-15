<script setup lang="ts">
import { computed, ref, watch } from "vue";
import Accordion from "primevue/accordion";
import AccordionContent from "primevue/accordioncontent";
import AccordionHeader from "primevue/accordionheader";
import AccordionPanel from "primevue/accordionpanel";
import Button from "primevue/button";
import Message from "primevue/message";
import { ChevronDown, GitCommitHorizontal, Rows3 } from "lucide-vue-next";
import { materializeTrace } from "../algorithms";
import { rowOperationToLatex } from "../format/latex";
import type { TraceDisplay } from "../ui/types";
import FormulaBlock from "./FormulaBlock.vue";
import MatrixTable from "./MatrixTable.vue";

const props = defineProps<{ trace: TraceDisplay }>();
const visibleCount = ref(16);

watch(
  () => props.trace,
  () => {
    visibleCount.value = 16;
  },
);

const visibleOperations = computed(() => props.trace.operations.slice(0, visibleCount.value));
const steps = computed(() => materializeTrace(props.trace.initial, visibleOperations.value));
const hasMore = computed(() => visibleCount.value < props.trace.operations.length);

function showMore(): void {
  visibleCount.value = Math.min(visibleCount.value + 16, props.trace.operations.length);
}
</script>

<template>
  <div class="trace-panel">
    <div class="trace-panel__intro">
      <div class="trace-panel__icon"><Rows3 :size="20" /></div>
      <div>
        <h3>{{ trace.operations.length }} 次行变换</h3>
        <p>点击任一步骤查看该操作之后的矩阵状态。</p>
      </div>
    </div>

    <Message v-if="trace.operations.length === 0" severity="secondary" :closable="false">
      输入矩阵已经是目标形式，无需执行行变换。
    </Message>

    <Accordion v-else class="trace-accordion">
      <AccordionPanel v-for="(step, index) in steps" :key="index" :value="String(index)">
        <AccordionHeader>
          <span class="trace-step__number">{{ String(index + 1).padStart(2, '0') }}</span>
          <span class="trace-step__operation"><FormulaBlock :latex="rowOperationToLatex(step.operation)" inline /></span>
          <ChevronDown class="trace-step__chevron" :size="16" />
        </AccordionHeader>
        <AccordionContent>
          <div class="trace-step__matrix">
            <span><GitCommitHorizontal :size="14" /> 变换后的矩阵</span>
            <MatrixTable :matrix="step.matrix" :split-after="trace.splitAfter" :label="`第 ${index + 1} 步矩阵`" />
          </div>
        </AccordionContent>
      </AccordionPanel>
    </Accordion>

    <div v-if="hasMore" class="trace-panel__more">
      <Button severity="secondary" outlined @click="showMore">
        再显示 {{ Math.min(16, trace.operations.length - visibleCount) }} 步
      </Button>
      <span>当前显示 {{ visibleCount }} / {{ trace.operations.length }}</span>
    </div>

    <Message v-if="trace.truncated" severity="warn" :closable="false">
      步骤记录达到上限；最终结果仍已完整计算。
    </Message>
  </div>
</template>
