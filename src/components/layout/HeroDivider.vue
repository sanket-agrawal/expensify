<script setup lang="ts">
interface Props {
  fillClass?: string;
  flip?: boolean;
}

withDefaults(defineProps<Props>(), {
  fillClass: 'fill-sand dark:fill-[#0B1D26]',
  flip: false,
});
</script>

<template>
  <div
    :class="[
      'w-full overflow-hidden leading-none select-none pointer-events-none',
      flip ? 'rotate-180' : '',
    ]"
    aria-hidden="true"
  >
    <svg
      viewBox="0 0 1200 120"
      preserveAspectRatio="none"
      class="relative block w-full h-8 sm:h-12"
    >
      <path
        d="M0,0 C150,90 350,-40 500,50 C650,140 900,10 1200,60 L1200,120 L0,120 Z"
        :class="fillClass"
      />
    </svg>
  </div>
</template>
