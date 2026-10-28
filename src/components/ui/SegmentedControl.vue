<script setup lang="ts" generic="T extends string | number">
import type { Component } from 'vue';

interface Option {
  value: T;
  label: string;
  icon?: Component;
}

interface Props {
  options: Option[];
  modelValue: T;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: T): void;
}>();

function select(val: T) {
  if (props.disabled || val === props.modelValue) return;
  emit('update:modelValue', val);
}
</script>

<template>
  <div
    class="flex items-center p-1 bg-sand-200/60 dark:bg-white/5 rounded-btn select-none"
    role="tablist"
  >
    <button
      v-for="opt in options"
      :key="String(opt.value)"
      type="button"
      role="tab"
      :aria-selected="modelValue === opt.value"
      :disabled="disabled"
      :class="[
        'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs sm:text-sm font-medium rounded-[10px] transition-all duration-150',
        modelValue === opt.value
          ? 'bg-card text-ink shadow-soft font-semibold'
          : 'text-ink-muted hover:text-ink hover:bg-white/30 dark:hover:bg-white/5',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
      ]"
      @click="select(opt.value)"
    >
      <component :is="opt.icon" v-if="opt.icon" class="w-3.5 h-3.5 shrink-0" />
      <span>{{ opt.label }}</span>
    </button>
  </div>
</template>
