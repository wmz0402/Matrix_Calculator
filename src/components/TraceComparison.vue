<script setup lang="ts">
import { ArrowRight } from "lucide-vue-next";
import type { Matrix } from "../core";
import MatrixTable from "./MatrixTable.vue";

defineProps<{
  before: Matrix;
  after: Matrix;
  affectedRows: readonly number[];
  stepNumber: number;
  splitAfter?: number;
}>();
</script>

<template>
  <div class="trace-step__comparison">
    <div class="trace-step__matrix trace-step__matrix--before">
      <span>变换前</span>
      <MatrixTable
        :matrix="before"
        :split-after="splitAfter"
        :label="`第 ${stepNumber} 步变换前的矩阵`"
      />
    </div>
    <div class="trace-step__arrow" aria-hidden="true"><ArrowRight :size="18" /></div>
    <div class="trace-step__matrix trace-step__matrix--after">
      <span>变换后 · 高亮本次变化行</span>
      <MatrixTable
        :matrix="after"
        :split-after="splitAfter"
        :highlight-rows="affectedRows"
        :label="`第 ${stepNumber} 步变换后的矩阵`"
      />
    </div>
  </div>
</template>
