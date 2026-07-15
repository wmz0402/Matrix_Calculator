<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import Accordion from "primevue/accordion";
import AccordionContent from "primevue/accordioncontent";
import AccordionHeader from "primevue/accordionheader";
import AccordionPanel from "primevue/accordionpanel";
import Button from "primevue/button";
import Message from "primevue/message";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsDown,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUp,
  ListTree,
  Rows3,
} from "lucide-vue-next";
import { applyRowOperation, materializeTrace, type RowOperation } from "../algorithms";
import type { Matrix } from "../core";
import { rowOperationToLatex } from "../format/latex";
import type { TraceDisplay } from "../ui/types";
import FormulaBlock from "./FormulaBlock.vue";
import TraceComparison from "./TraceComparison.vue";

const props = defineProps<{ trace: TraceDisplay }>();
const viewMode = ref<"focus" | "all">("focus");
const selectedIndex = ref(0);
const visibleCount = ref(16);
const activeSteps = ref<string[]>([]);
const stepList = ref<HTMLElement | null>(null);

let cacheTrace = props.trace;
const focusedMatrixCache = new Map<number, { before: Matrix; after: Matrix }>();

watch(
  () => props.trace,
  (trace) => {
    viewMode.value = "focus";
    selectedIndex.value = 0;
    visibleCount.value = 16;
    activeSteps.value = [];
    cacheTrace = trace;
    focusedMatrixCache.clear();
  },
  { flush: "sync" },
);

const visibleOperations = computed(() => props.trace.operations.slice(0, visibleCount.value));
const bulkSteps = computed(() => {
  const materialized = materializeTrace(props.trace.initial, visibleOperations.value);
  return materialized.map((step, index) => ({
    ...step,
    before: index === 0 ? props.trace.initial : materialized[index - 1]!.matrix,
    affectedRows: affectedRows(step.operation),
  }));
});
const hasMore = computed(() => visibleCount.value < props.trace.operations.length);
const allVisibleExpanded = computed(
  () =>
    bulkSteps.value.length > 0 &&
    bulkSteps.value.every((_, index) => activeSteps.value.includes(String(index))),
);

const navigatorSteps = computed(() => {
  const total = props.trace.operations.length;
  const windowSize = 24;
  const preferredBefore = 8;
  const start = Math.max(0, Math.min(selectedIndex.value - preferredBefore, total - windowSize));
  const end = Math.min(total, start + windowSize);
  return props.trace.operations.slice(start, end).map((operation, offset) => ({
    operation,
    index: start + offset,
  }));
});

const navigatorRange = computed(() => {
  const first = navigatorSteps.value[0];
  const last = navigatorSteps.value.at(-1);
  if (first === undefined || last === undefined) return "";
  return `${first.index + 1}–${last.index + 1} / ${props.trace.operations.length}`;
});

const focusedStep = computed(() => {
  const operation = props.trace.operations[selectedIndex.value];
  if (operation === undefined) return null;
  const matrices = focusedMatrices(selectedIndex.value);
  return { operation, ...matrices, affectedRows: affectedRows(operation) };
});

function affectedRows(operation: RowOperation): readonly number[] {
  if (operation.type === "swap") return [operation.first, operation.second];
  if (operation.type === "scale") return [operation.row];
  return [operation.target];
}

function focusedMatrices(index: number): { before: Matrix; after: Matrix } {
  if (cacheTrace !== props.trace) {
    cacheTrace = props.trace;
    focusedMatrixCache.clear();
  }

  const cached = focusedMatrixCache.get(index);
  if (cached !== undefined) return cached;

  let start = 0;
  let before = props.trace.initial;
  for (const [cachedIndex, snapshot] of focusedMatrixCache) {
    if (cachedIndex < index && cachedIndex + 1 > start) {
      start = cachedIndex + 1;
      before = snapshot.after;
    }
  }
  for (let current = start; current < index; current += 1) {
    before = applyRowOperation(before, props.trace.operations[current]!);
  }

  const after = applyRowOperation(before, props.trace.operations[index]!);
  const result = { before, after };
  focusedMatrixCache.set(index, result);
  if (focusedMatrixCache.size > 32) {
    const oldest = focusedMatrixCache.keys().next().value as number | undefined;
    if (oldest !== undefined && oldest !== index) focusedMatrixCache.delete(oldest);
  }
  return result;
}

function scrollSelectedStepIntoView(): void {
  void nextTick(() => {
    stepList.value
      ?.querySelector<HTMLElement>(`[data-step-index="${selectedIndex.value}"]`)
      ?.scrollIntoView({ block: "nearest" });
  });
}

function selectStep(index: number): void {
  const lastIndex = props.trace.operations.length - 1;
  selectedIndex.value = Math.max(0, Math.min(index, lastIndex));
  scrollSelectedStepIntoView();
}

function setViewMode(mode: "focus" | "all"): void {
  viewMode.value = mode;
  if (mode === "all") expandAll();
  if (mode === "focus") scrollSelectedStepIntoView();
}

function expandAll(): void {
  activeSteps.value = bulkSteps.value.map((_, index) => String(index));
}

function collapseAll(): void {
  activeSteps.value = [];
}

function showMore(): void {
  visibleCount.value = Math.min(visibleCount.value + 16, props.trace.operations.length);
}

function handleNavigatorKeydown(event: KeyboardEvent): void {
  if (event.key === "ArrowLeft") selectStep(selectedIndex.value - 1);
  else if (event.key === "ArrowRight") selectStep(selectedIndex.value + 1);
  else if (event.key === "Home") selectStep(0);
  else if (event.key === "End") selectStep(props.trace.operations.length - 1);
  else return;
  event.preventDefault();
}
</script>

<template>
  <div class="trace-panel">
    <div class="trace-panel__intro">
      <div class="trace-panel__identity">
        <div class="trace-panel__icon"><Rows3 :size="20" /></div>
        <div>
          <h3>{{ trace.operations.length }} 次行变换</h3>
          <p>{{ viewMode === 'focus' ? '逐步对照矩阵变化，使用方向键可以前后切换。' : '纵览当前批次，可同时展开多个步骤。' }}</p>
        </div>
      </div>
      <div v-if="trace.operations.length > 0" class="trace-view-switch" role="group" aria-label="推导步骤显示方式">
        <button type="button" :class="{ 'is-active': viewMode === 'focus' }" :aria-pressed="viewMode === 'focus'" @click="setViewMode('focus')">
          <ListTree :size="14" />单步浏览
        </button>
        <button type="button" :class="{ 'is-active': viewMode === 'all' }" :aria-pressed="viewMode === 'all'" @click="setViewMode('all')">
          <ChevronsDown :size="14" />全部展开
        </button>
      </div>
    </div>

    <Message v-if="trace.operations.length === 0" severity="secondary" :closable="false">
      输入矩阵已经是目标形式，无需执行行变换。
    </Message>

    <div
      v-else-if="viewMode === 'focus' && focusedStep"
      class="trace-navigator"
      tabindex="0"
      aria-label="单步推导浏览器，可使用左右方向键切换步骤"
      @keydown="handleNavigatorKeydown"
    >
      <aside class="trace-navigator__sidebar" aria-label="行变换步骤列表">
        <div class="trace-navigator__list-head">
          <span>步骤列表</span><small>{{ navigatorRange }}</small>
        </div>
        <div ref="stepList" class="trace-navigator__list">
          <button
            v-for="item in navigatorSteps"
            :key="item.index"
            type="button"
            :data-step-index="item.index"
            :class="['trace-navigator__item', { 'is-active': selectedIndex === item.index }]"
            :aria-current="selectedIndex === item.index ? 'step' : undefined"
            @click="selectStep(item.index)"
          >
            <span>{{ String(item.index + 1).padStart(2, '0') }}</span>
            <FormulaBlock :latex="rowOperationToLatex(item.operation)" inline />
          </button>
        </div>
      </aside>

      <section class="trace-focus" aria-live="polite">
        <header class="trace-focus__header">
          <div class="trace-focus__title">
            <span>STEP {{ String(selectedIndex + 1).padStart(2, '0') }}</span>
            <FormulaBlock :latex="rowOperationToLatex(focusedStep.operation)" inline />
          </div>
          <div class="trace-focus__controls">
            <Button v-tooltip.top="'第一步'" text rounded severity="secondary" aria-label="跳到第一步" :disabled="selectedIndex === 0" @click="selectStep(0)">
              <ChevronsLeft :size="16" />
            </Button>
            <Button v-tooltip.top="'上一步'" text rounded severity="secondary" aria-label="上一步" :disabled="selectedIndex === 0" @click="selectStep(selectedIndex - 1)">
              <ChevronLeft :size="16" />
            </Button>
            <span>{{ selectedIndex + 1 }} / {{ trace.operations.length }}</span>
            <Button v-tooltip.top="'下一步'" text rounded severity="secondary" aria-label="下一步" :disabled="selectedIndex === trace.operations.length - 1" @click="selectStep(selectedIndex + 1)">
              <ChevronRight :size="16" />
            </Button>
            <Button v-tooltip.top="'最后一步'" text rounded severity="secondary" aria-label="跳到最后一步" :disabled="selectedIndex === trace.operations.length - 1" @click="selectStep(trace.operations.length - 1)">
              <ChevronsRight :size="16" />
            </Button>
          </div>
        </header>

        <TraceComparison
          :before="focusedStep.before"
          :after="focusedStep.after"
          :affected-rows="focusedStep.affectedRows"
          :step-number="selectedIndex + 1"
          :split-after="trace.splitAfter"
        />
      </section>
    </div>

    <div v-else-if="viewMode === 'all'" class="trace-bulk">
      <div class="trace-bulk__toolbar">
        <span>当前批次 {{ bulkSteps.length }} / {{ trace.operations.length }} 步</span>
        <div>
          <Button class="trace-expand-all" size="small" severity="secondary" outlined :disabled="allVisibleExpanded" @click="expandAll">
            <ChevronsDown :size="14" />{{ hasMore ? '展开当前批次' : '展开全部' }}
          </Button>
          <Button class="trace-collapse-all" size="small" severity="secondary" text :disabled="activeSteps.length === 0" @click="collapseAll">
            <ChevronsUp :size="14" />全部收起
          </Button>
        </div>
      </div>

      <Accordion v-model:value="activeSteps" class="trace-accordion" multiple lazy>
        <AccordionPanel v-for="(step, index) in bulkSteps" :key="index" :value="String(index)">
          <AccordionHeader>
            <template #default="{ active }">
              <span class="trace-step__number">{{ String(index + 1).padStart(2, '0') }}</span>
              <span class="trace-step__operation"><FormulaBlock :latex="rowOperationToLatex(step.operation)" inline /></span>
              <ChevronDown :class="['trace-step__chevron', { 'trace-step__chevron--active': active }]" :size="16" />
            </template>
            <template #toggleicon><span /></template>
          </AccordionHeader>
          <AccordionContent>
            <TraceComparison
              :before="step.before"
              :after="step.matrix"
              :affected-rows="step.affectedRows"
              :step-number="index + 1"
              :split-after="trace.splitAfter"
            />
          </AccordionContent>
        </AccordionPanel>
      </Accordion>

      <div v-if="hasMore" class="trace-panel__more">
        <Button severity="secondary" outlined @click="showMore">
          再显示 {{ Math.min(16, trace.operations.length - visibleCount) }} 步
        </Button>
        <span>当前显示 {{ visibleCount }} / {{ trace.operations.length }}</span>
      </div>
    </div>

    <Message v-if="trace.truncated" severity="warn" :closable="false">
      步骤记录达到上限；最终结果仍已完整计算。
    </Message>
  </div>
</template>
