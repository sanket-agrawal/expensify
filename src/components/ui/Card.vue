<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  border?: boolean;
  as?: string;
}

const props = withDefaults(defineProps<Props>(), {
  padding: 'md',
  hover: false,
  border: false,
  as: 'div',
});

const paddingClasses = computed(() => {
  switch (props.padding) {
    case 'none':
      return '';
    case 'sm':
      return 'p-3 sm:p-4';
    case 'lg':
      return 'p-6 sm:p-8';
    case 'md':
    default:
      return 'p-4 sm:p-6';
  }
});
</script>

<template>
  <component
    :is="as"
    :class="[
      'bg-card text-ink rounded-card shadow-card transition-all duration-200',
      border ? 'border border-sand-200 dark:border-white/5' : '',
      hover ? 'hover:-translate-y-0.5 hover:shadow-float cursor-pointer' : '',
      paddingClasses,
    ]"
  >
    <slot />
  </component>
</template>
