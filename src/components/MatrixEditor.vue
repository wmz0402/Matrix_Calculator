<script setup lang="ts">
import Button from "primevue/button";
import Tag from "primevue/tag";
import Textarea from "primevue/textarea";
import { Eraser, Grid3X3 } from "lucide-vue-next";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    symbol: "A" | "B";
    title: string;
    dimensions: string;
    disabled?: boolean;
    placeholder: string;
  }>(),
  { disabled: false },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
  calculate: [];
}>();

function updateValue(value: string | undefined): void {
  emit("update:modelValue", value ?? "");
}
</script>

<template>
  <section :class="['matrix-editor', { 'matrix-editor--disabled': disabled }]" :aria-labelledby="`matrix-${symbol}-title`">
    <header class="matrix-editor__header">
      <div class="matrix-editor__identity">
        <span class="matrix-editor__symbol">{{ symbol }}</span>
        <div>
          <h3 :id="`matrix-${symbol}-title`">{{ title }}</h3>
          <p>{{ symbol === 'A' ? '系数矩阵 / 主矩阵' : '第二矩阵 / 右端项' }}</p>
        </div>
      </div>
      <div class="matrix-editor__meta">
        <Tag :value="dimensions" severity="secondary" rounded>
          <template #icon><Grid3X3 :size="13" /></template>
        </Tag>
        <Button
          v-if="modelValue.length > 0"
          v-tooltip.top="'清空此矩阵'"
          text
          rounded
          severity="secondary"
          :aria-label="`清空矩阵 ${symbol}`"
          @click="emit('update:modelValue', '')"
        >
          <Eraser :size="16" />
        </Button>
      </div>
    </header>

    <div class="matrix-editor__input-wrap">
      <span class="matrix-editor__equals" aria-hidden="true">{{ symbol }} =</span>
      <Textarea
        :id="`matrix-${symbol}`"
        :model-value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        rows="9"
        fluid
        spellcheck="false"
        :aria-label="`矩阵 ${symbol}`"
        @update:model-value="updateValue"
        @keydown.meta.enter.prevent="emit('calculate')"
        @keydown.ctrl.enter.prevent="emit('calculate')"
      />
      <div v-if="disabled" class="matrix-editor__disabled-note">当前运算不需要矩阵 B</div>
    </div>

    <footer class="matrix-editor__footer">
      <span>换行分行</span><i />
      <span>空格或逗号分列</span><i />
      <span>支持 3/4 与 0.125</span>
    </footer>
  </section>
</template>
