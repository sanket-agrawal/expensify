<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  name: string;
  colorKey?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBorder?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  colorKey: '',
  size: 'md',
  showBorder: false,
});

const PALETTE = [
  'bg-lagoon/20 text-lagoon dark:bg-lagoon/30 dark:text-lagoon',
  'bg-coral/20 text-coral dark:bg-coral/30 dark:text-coral',
  'bg-sunshine/30 text-[#9E6D00] dark:bg-sunshine/25 dark:text-sunshine',
  'bg-deep-sea/20 text-deep-sea dark:bg-deep-sea/30 dark:text-deep-sea',
  'bg-seafoam/40 text-seafoam-dark dark:bg-seafoam/30 dark:text-seafoam',
  'bg-sky/50 text-deep-sea dark:bg-sky/30 dark:text-sky',
];

const initials = computed(() => {
  if (!props.name) return '?';
  const parts = props.name.trim().split(/\s+/);
  if (parts.length === 1) {
    const firstPart = parts[0];
    return firstPart ? firstPart.slice(0, 2).toUpperCase() : '?';
  }
  const first = parts[0]?.charAt(0) ?? '';
  const second = parts[1]?.charAt(0) ?? '';
  return `${first}${second}`.toUpperCase();
});

const colorClass = computed(() => {
  const key = props.colorKey || props.name;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index] ?? PALETTE[0];
});

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'w-7 h-7 text-xs font-semibold';
    case 'lg':
      return 'w-12 h-12 text-base font-bold';
    case 'xl':
      return 'w-16 h-16 text-xl font-bold';
    case 'md':
    default:
      return 'w-9 h-9 text-sm font-semibold';
  }
});
</script>

<template>
  <div
    :class="[
      'inline-flex items-center justify-center rounded-full shrink-0 select-none font-display tracking-wide',
      sizeClasses,
      colorClass,
      showBorder ? 'ring-2 ring-card shadow-sm' : '',
    ]"
    :title="name"
    :aria-label="name"
  >
    <span>{{ initials }}</span>
  </div>
</template>
