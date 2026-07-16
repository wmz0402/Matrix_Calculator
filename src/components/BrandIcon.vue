<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    :width="size"
    :height="size"
    fill="none"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="brand-icon"
  >
    <!-- Left Bracket -->
    <path
      d="M 28 12 L 12 12 L 12 88 L 28 88"
      stroke-width="8"
      class="brand-icon__bracket"
    />
    <!-- Sigma in the middle -->
    <path
      d="M 66 33 L 66 22 L 34 22 L 52 50 L 34 78 L 66 78 L 66 67"
      stroke-width="8"
      class="brand-icon__sigma"
    />
    <!-- Right Bracket -->
    <path
      d="M 72 12 L 88 12 L 88 88 L 72 88"
      stroke-width="8"
      class="brand-icon__bracket"
    />
  </svg>
</template>

<script setup lang="ts">
defineProps<{
  size?: number | string;
}>();
</script>

<style scoped>
.brand-icon {
  display: inline-block;
  vertical-align: middle;
}
.brand-icon__bracket {
  stroke: var(--brand-icon-bracket);
  transition: stroke 0.25s ease;
}
.brand-icon__sigma {
  stroke: var(--brand-icon-sigma);
  transition: stroke 0.25s ease;
}
</style>
