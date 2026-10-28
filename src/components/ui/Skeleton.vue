<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  width?: string;
  height?: string;
  radius?: 'sm' | 'md' | 'lg' | 'pill' | 'circle';
}

const props = withDefaults(defineProps<Props>(), {
  radius: 'md',
});

const radiusClasses = computed(() => {
  switch (props.radius) {
    case 'sm':
      return 'rounded-md';
    case 'lg':
      return 'rounded-card';
    case 'pill':
      return 'rounded-chip';
    case 'circle':
      return 'rounded-full';
    case 'md':
    default:
      return 'rounded-btn';
  }
});
</script>

<template>
  <div
    :class="[
      'animate-pulse bg-sand-200/80 dark:bg-white/10 shrink-0',
      radiusClasses,
      width ?? 'w-full',
      height ?? 'h-4',
    ]"
    aria-hidden="true"
  />
</template>
