<script setup lang="ts">
import { computed } from "vue";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import Tag from "primevue/tag";
import { ArrowRight, Command, Play, Shuffle, Trash2 } from "lucide-vue-next";
import FormulaBlock from "./FormulaBlock.vue";
import { OPERATION_GROUPS, getOperationOption, type Operation } from "../ui/types";

const props = defineProps<{
  operation: Operation;
  exponent: string;
  loading: boolean;
  canSwap: boolean;
}>();

const emit = defineEmits<{
  "update:operation": [value: Operation];
  "update:exponent": [value: string];
  calculate: [];
  swap: [];
  clear: [];
}>();

const selected = computed({
  get: () => props.operation,
  set: (value: Operation) => emit("update:operation", value),
});
const option = computed(() => getOperationOption(props.operation));
const operationGroups = OPERATION_GROUPS.map((group) => ({
  ...group,
  items: [...group.items],
}));

function updateExponent(value: string | undefined): void {
  emit("update:exponent", value ?? "");
}
</script>

<template>
  <aside class="operation-panel" aria-labelledby="operation-title">
    <div class="operation-panel__eyebrow">OPERATION</div>
    <div class="operation-panel__heading">
      <div>
        <h2 id="operation-title">选择运算</h2>
        <p>所有计算均在本机完成</p>
      </div>
      <Tag value="精确有理数" severity="contrast" rounded />
    </div>

    <label class="control-label" for="operation-select">运算类型</label>
    <Select
      id="operation-select"
      v-model="selected"
      :options="operationGroups"
      option-label="label"
      option-value="value"
      option-group-label="label"
      option-group-children="items"
      fluid
      filter
      filter-placeholder="搜索运算"
      aria-label="选择矩阵运算"
    >
      <template #optiongroup="slotProps">
        <span class="operation-group-label">{{ slotProps.option.label }}</span>
      </template>
      <template #option="slotProps">
        <div class="operation-option">
          <span>{{ slotProps.option.label }}</span>
          <code>{{ slotProps.option.notation }}</code>
        </div>
      </template>
      <template #value="slotProps">
        <div v-if="slotProps.value" class="operation-value">
          <span>{{ option.label }}</span>
          <code>{{ option.notation }}</code>
        </div>
        <span v-else>选择运算</span>
      </template>
    </Select>

    <div class="operation-preview">
      <div class="operation-preview__formula"><FormulaBlock :latex="option.notation" /></div>
      <p>{{ option.description }}</p>
      <span class="operation-preview__route">
        {{ option.requiresRight ? "使用 A 与 B" : "仅使用 A" }}
        <ArrowRight :size="14" />
      </span>
    </div>

    <div v-if="option.requiresExponent" class="power-field">
      <label class="control-label" for="power-input">整数幂 n</label>
      <InputText
        id="power-input"
        :model-value="exponent"
        fluid
        inputmode="numeric"
        aria-label="整数幂 n"
        @update:model-value="updateExponent"
      />
    </div>

    <Button class="calculate-button" :loading="loading" size="large" fluid @click="emit('calculate')">
      <Play :size="18" fill="currentColor" />
      <span>{{ loading ? "正在计算" : "开始计算" }}</span>
    </Button>

    <div class="operation-panel__actions">
      <Button severity="secondary" outlined :disabled="!canSwap" @click="emit('swap')">
        <Shuffle :size="16" /><span>交换 A / B</span>
      </Button>
      <Button severity="secondary" text @click="emit('clear')">
        <Trash2 :size="16" /><span>清空</span>
      </Button>
    </div>

    <div class="shortcut-hint">
      <Command :size="14" />
      <span>Ctrl / ⌘ + Enter 快速计算</span>
    </div>
  </aside>
</template>
