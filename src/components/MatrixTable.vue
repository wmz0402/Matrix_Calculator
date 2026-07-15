<script setup lang="ts">
import type { Matrix } from "../core";

defineProps<{
  matrix: Matrix;
  splitAfter?: number;
  label?: string;
}>();
</script>

<template>
  <div class="matrix-viewport" role="group" :aria-label="label ?? '矩阵'">
    <div v-if="matrix.rows === 0 || matrix.cols === 0" class="empty-basis">空基</div>
    <div v-else class="matrix-brackets">
      <table class="matrix-table">
        <caption class="sr-only">{{ label ?? '矩阵' }}，{{ matrix.rows }} 行 {{ matrix.cols }} 列</caption>
        <tbody>
          <tr v-for="row in matrix.rows" :key="row">
            <td
              v-for="col in matrix.cols"
              :key="col"
              :class="{ 'matrix-table__split': splitAfter !== undefined && col - 1 === splitAfter }"
            >
              {{ matrix.get(row - 1, col - 1).toString() }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
