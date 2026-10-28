<script setup lang="ts">
import { computed } from 'vue';

export type ChipColor = 'lagoon' | 'deep-sea' | 'coral' | 'sunshine' | 'seafoam' | 'sky' | 'sand' | 'neutral';

interface Props {
  color?: ChipColor;
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
  clickable?: boolean;
  label?: string;
}

const props = withDefaults(defineProps<Props>(), {
  color: 'lagoon',
  size: 'md',
  active: false,
  clickable: false,
  label: '',
});

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void;
}>();

const colorClasses = computed(() => {
  switch (props.color) {
    case 'coral':
      return 'bg-coral/15 text-coral dark:bg-coral/20 dark:text-coral';
    case 'seafoam':
      return 'bg-seafoam/40 text-seafoam-dark dark:bg-seafoam/20 dark:text-seafoam';
    case 'sunshine':
      return 'bg-sunshine/25 text-[#9E6D00] dark:bg-sunshine/20 dark:text-sunshine';
    case 'sky':
      return 'bg-sky text-deep-sea dark:bg-sky/20 dark:text-sky';
    case 'deep-sea':
      return 'bg-deep-sea/15 text-deep-sea dark:bg-deep-sea/30 dark:text-deep-sea';
    case 'sand':
      return 'bg-sand-200 text-ink dark:bg-white/10 dark:text-sand-100';
    case 'neutral':
      return 'bg-sand-100 text-ink-muted dark:bg-white/5 dark:text-ink-muted';
    case 'lagoon':
    default:
      return 'bg-lagoon/15 text-lagoon hover:bg-lagoon/20 dark:bg-lagoon/20 dark:text-lagoon';
  }
});

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'h-7 px-2 text-xs gap-1.5';
    case 'lg':
      return 'h-11 px-4 text-base gap-2.5';
    case 'md':
    default:
      return 'h-9 px-3 text-sm gap-2';
  }
});
</script>

<template>
  <div
    :class="[
      'inline-flex items-center justify-center font-medium rounded-chip transition-all duration-150 select-none',
      colorClasses,
      sizeClasses,
      clickable ? 'cursor-pointer active:scale-95 hover:brightness-95' : '',
      active ? 'ring-2 ring-current ring-offset-1 ring-offset-card font-semibold' : '',
    ]"
    role="button"
    :tabindex="clickable ? 0 : undefined"
    @click="(e) => clickable && emit('click', e)"
    @keydown.enter="(e) => clickable && emit('click', e as unknown as MouseEvent)"
  >
    <div class="shrink-0 flex items-center justify-center">
      <slot name="icon" />
    </div>
    <span v-if="label || $slots.default" class="truncate">
      <slot>{{ label }}</slot>
    </span>
  </div>
</template>
