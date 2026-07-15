<script lang="ts">
let mathJaxQueue = Promise.resolve();
</script>

<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from "vue";

const props = withDefaults(
  defineProps<{
    latex: string;
    inline?: boolean;
  }>(),
  { inline: false },
);

const host = ref<HTMLElement | null>(null);

function typeset(): void {
  void nextTick(() => {
    const element = host.value;
    const mathJax = window.MathJax;
    if (element === null || mathJax?.typesetPromise === undefined) return;

    const source = props.inline ? `\\(${props.latex}\\)` : `\\[${props.latex}\\]`;
    mathJaxQueue = mathJaxQueue
      .then(async () => {
        if (host.value !== element) return;
        mathJax.typesetClear?.([element]);
        element.textContent = source;
        await mathJax.typesetPromise?.([element]);
      })
      .catch(() => undefined);
  });
}

onMounted(typeset);
watch(() => props.latex, typeset);
</script>

<template>
  <component :is="inline ? 'span' : 'div'" ref="host" :class="['formula-block', { 'formula-block--inline': inline }]">
    {{ inline ? `\\(${latex}\\)` : `\\[${latex}\\]` }}
  </component>
</template>
