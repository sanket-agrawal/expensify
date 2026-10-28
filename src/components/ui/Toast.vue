<script setup lang="ts">
import { useToast } from '@/composables/useToast';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-vue-next';

const { toasts, dismiss } = useToast();
</script>

<template>
  <div
    class="fixed z-50 bottom-20 sm:bottom-6 inset-x-4 sm:inset-x-auto sm:right-6 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    aria-live="polite"
    aria-atomic="true"
  >
    <TransitionGroup
      enter-active-class="transition duration-250 ease-out"
      enter-from-class="opacity-0 translate-y-3 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="pointer-events-auto flex items-center justify-between gap-3 p-3.5 bg-card text-ink rounded-btn shadow-float border border-sand-200 dark:border-white/10"
        role="alert"
      >
        <div class="flex items-center gap-2.5 min-w-0">
          <CheckCircle2
            v-if="toast.type === 'success'"
            class="w-5 h-5 text-lagoon shrink-0"
          />
          <AlertCircle
            v-else-if="toast.type === 'error'"
            class="w-5 h-5 text-coral shrink-0"
          />
          <Info
            v-else
            class="w-5 h-5 text-deep-sea dark:text-sky shrink-0"
          />
          <p class="text-sm font-medium leading-snug break-words">
            {{ toast.message }}
          </p>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <button
            v-if="toast.action"
            type="button"
            class="text-xs font-semibold px-2 py-1 rounded bg-sand-200 dark:bg-white/10 text-deep-sea dark:text-sky hover:brightness-95 active:scale-95 transition-all"
            @click="() => { toast.action?.onClick(); dismiss(toast.id); }"
          >
            {{ toast.action.label }}
          </button>
          <button
            type="button"
            class="p-1 text-ink-muted hover:text-ink rounded transition-colors"
            aria-label="Dismiss"
            @click="dismiss(toast.id)"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>
