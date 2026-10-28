<script setup lang="ts">
interface Props {
  title: string;
  description?: string;
}

defineProps<Props>();
</script>

<template>
  <div class="flex flex-col items-center justify-center text-center p-8 sm:p-12 max-w-sm mx-auto">
    <!-- Hand-crafted beach holiday SVG: Warm sun, gentle waves, and chill palm breeze -->
    <div class="w-32 h-32 mb-4 text-lagoon select-none" aria-hidden="true">
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full drop-shadow-sm">
        <!-- Sun with warm golden glow -->
        <circle cx="60" cy="46" r="22" fill="#FFC857" fill-opacity="0.25" />
        <circle cx="60" cy="46" r="15" fill="#FFC857" />
        <circle cx="60" cy="46" r="8" fill="#FFE299" />

        <!-- Distant island silhouette -->
        <path
          d="M20 86C28 78 40 76 56 80C72 84 88 78 100 86"
          stroke="#0E5A6B"
          stroke-width="2"
          stroke-linecap="round"
          stroke-opacity="0.4"
        />

        <!-- Gentle ocean waves with teal & seafoam -->
        <path
          d="M15 92C25 88 35 96 45 92C55 88 65 96 75 92C85 88 95 96 105 92"
          stroke="#1FA3A3"
          stroke-width="3"
          stroke-linecap="round"
        />
        <path
          d="M25 100C35 96 45 104 55 100C65 96 75 104 85 100C95 96 100 100 105 98"
          stroke="#BFE9DD"
          stroke-width="2.5"
          stroke-linecap="round"
        />

        <!-- Subtle coconut palm branch floating in the breeze -->
        <path
          d="M75 42C80 34 88 32 94 33"
          stroke="#0E5A6B"
          stroke-width="2"
          stroke-linecap="round"
        />
        <path
          d="M84 35C83 30 87 26 92 27"
          stroke="#1FA3A3"
          stroke-width="1.8"
          stroke-linecap="round"
        />
        <path
          d="M87 36C89 32 94 30 98 33"
          stroke="#1FA3A3"
          stroke-width="1.8"
          stroke-linecap="round"
        />
      </svg>
    </div>

    <h3 class="font-display text-xl font-semibold text-ink mb-1.5">
      {{ title }}
    </h3>
    <p v-if="description" class="text-sm text-ink-muted mb-6 leading-relaxed max-w-xs">
      {{ description }}
    </p>

    <div v-if="$slots.action" class="flex items-center justify-center">
      <slot name="action" />
    </div>
  </div>
</template>
