<script setup lang="ts">
import { watch, onMounted, onUnmounted, ref } from 'vue';
import { X } from 'lucide-vue-next';

interface Props {
  open: boolean;
  title?: string;
  description?: string;
  maxHeight?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  description: '',
  maxHeight: 'max-h-[85vh]',
});

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'close'): void;
}>();

const sheetContentRef = ref<HTMLElement | null>(null);

function close() {
  emit('update:open', false);
  emit('close');
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) {
    close();
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }
);

onMounted(() => {
  window.addEventListener('keydown', onKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown);
  document.body.style.overflow = '';
});
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 bg-ink/40 dark:bg-black/60 backdrop-blur-sm"
        aria-hidden="true"
        @click="close"
      />
    </Transition>

    <Transition
      enter-active-class="transition-transform duration-250 ease-out"
      enter-from-class="translate-y-full"
      enter-to-class="translate-y-0"
      leave-active-class="transition-transform duration-200 ease-in"
      leave-from-class="translate-y-0"
      leave-to-class="translate-y-full"
    >
      <div
        v-if="open"
        ref="sheetContentRef"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        class="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg w-full bg-card rounded-t-sheet shadow-float border-t border-sand-200 dark:border-white/10 flex flex-col focus:outline-none pb-safe"
        :class="maxHeight"
        tabindex="-1"
      >
        <!-- Pull bar indicator -->
        <div class="pt-3 pb-1 flex justify-center shrink-0 cursor-grab">
          <div class="w-10 h-1.2 rounded-full bg-sand-200 dark:bg-white/20" />
        </div>

        <!-- Header -->
        <div class="px-5 py-3 flex items-center justify-between shrink-0 border-b border-sand-200/60 dark:border-white/5">
          <div>
            <h2 v-if="title" class="font-display text-lg font-semibold text-ink">
              {{ title }}
            </h2>
            <p v-if="description" class="text-xs text-ink-muted mt-0.5">
              {{ description }}
            </p>
          </div>
          <button
            type="button"
            class="p-2 -mr-2 text-ink-muted hover:text-ink rounded-full hover:bg-sand-100 dark:hover:bg-white/5 transition-colors"
            aria-label="Close"
            @click="close"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Scrollable content -->
        <div class="px-5 py-4 overflow-y-auto flex-1 overscroll-contain">
          <slot />
        </div>

        <!-- Footer / Sticky Actions if provided -->
        <div v-if="$slots.footer" class="p-4 border-t border-sand-200/60 dark:border-white/5 shrink-0 bg-card">
          <slot name="footer" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
