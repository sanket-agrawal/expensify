<script setup lang="ts">
import { computed } from 'vue';
import { Loader2 } from 'lucide-vue-next';

interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'coral' | 'seafoam' | 'soft';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  block?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false,
  type: 'button',
  block: false,
});

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void;
}>();

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'bg-lagoon text-white hover:bg-lagoon-hover active:bg-lagoon-active shadow-soft focus-visible:ring-lagoon';
    case 'secondary':
      return 'bg-card text-ink border border-sand-200 dark:border-white/10 hover:bg-sand-50 dark:hover:bg-card-elevated shadow-soft focus-visible:ring-deep-sea';
    case 'coral':
      return 'bg-coral text-white hover:bg-coral-dark shadow-soft focus-visible:ring-coral';
    case 'seafoam':
      return 'bg-seafoam text-ink hover:brightness-95 active:brightness-90 focus-visible:ring-seafoam-dark';
    case 'soft':
      return 'bg-lagoon-light dark:bg-lagoon/20 text-deep-sea dark:text-lagoon hover:bg-lagoon/20 focus-visible:ring-lagoon';
    case 'ghost':
    default:
      return 'bg-transparent text-ink hover:bg-sand-200/50 dark:hover:bg-white/5 focus-visible:ring-lagoon';
  }
});

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'text-xs h-9 px-3 gap-1.5 rounded-btn';
    case 'lg':
      return 'text-base h-13 px-6 gap-2.5 rounded-btn font-semibold';
    case 'icon':
      return 'h-10 w-10 p-0 rounded-full justify-center';
    case 'md':
    default:
      return 'text-sm h-11 px-4 gap-2 rounded-btn font-medium';
  }
});
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[
      'inline-flex items-center justify-center transition-all duration-150 select-none outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]',
      variantClasses,
      sizeClasses,
      block ? 'w-full' : '',
    ]"
    @click="(e) => emit('click', e)"
  >
    <Loader2 v-if="loading" class="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
    <slot name="prefix" v-if="!loading" />
    <span :class="loading ? 'opacity-80' : ''">
      <slot />
    </span>
    <slot name="suffix" v-if="!loading" />
  </button>
</template>
