<script setup lang="ts">
import { computed } from 'vue';
import { formatMoney } from '@shared/money';

interface Props {
  amountMinor: number;
  currency?: string;
  showSign?: boolean;
  colored?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  displayFont?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  currency: 'INR',
  showSign: false,
  colored: false,
  size: 'md',
  displayFont: false,
});

const formatted = computed(() => {
  return formatMoney(props.amountMinor, props.currency, {
    showSign: props.showSign,
  });
});

const colorClass = computed(() => {
  if (!props.colored) return '';
  if (props.amountMinor > 0) {
    return 'text-lagoon dark:text-lagoon font-semibold';
  }
  if (props.amountMinor < 0) {
    return 'text-coral dark:text-coral font-semibold';
  }
  return 'text-ink-muted';
});

const sizeClass = computed(() => {
  switch (props.size) {
    case 'xs':
      return 'text-xs';
    case 'sm':
      return 'text-sm';
    case 'lg':
      return 'text-lg font-semibold';
    case 'xl':
      return 'text-2xl font-bold tracking-tight';
    case 'hero':
      return 'text-4xl sm:text-5xl font-bold tracking-tight';
    case 'md':
    default:
      return 'text-base font-medium';
  }
});
</script>

<template>
  <span
    :class="[
      'tabular-nums inline-block',
      displayFont || size === 'hero' || size === 'xl' ? 'font-display' : '',
      sizeClass,
      colorClass,
    ]"
  >
    {{ formatted }}
  </span>
</template>
