<script setup lang="ts">
import { watch, onMounted, onUnmounted, ref } from 'vue';
import { X, ZoomIn, ZoomOut } from 'lucide-vue-next';

interface Props {
  open: boolean;
  imageUrl: string;
  altText?: string;
  title?: string;
}

const props = withDefaults(defineProps<Props>(), {
  altText: 'Bill receipt photo',
  title: '',
});

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void;
  (e: 'close'): void;
}>();

const isZoomed = ref(false);

function close() {
  isZoomed.value = false;
  emit('update:open', false);
  emit('close');
}

function toggleZoom() {
  isZoomed.value = !isZoomed.value;
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) {
    close();
  }
}

watch(
  () => props.open,
  (val) => {
    if (val) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      isZoomed.value = false;
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
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        role="dialog"
        aria-modal="true"
        :aria-label="title || altText"
        class="fixed inset-0 z-50 bg-black/90 flex flex-col justify-between p-4 sm:p-6 select-none"
        tabindex="-1"
      >
        <!-- Top controls -->
        <div class="flex items-center justify-between text-white z-10">
          <div class="text-sm font-medium opacity-90 truncate max-w-[70vw]">
            {{ title || altText }}
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="p-2.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white"
              :aria-label="isZoomed ? 'Zoom out' : 'Zoom in'"
              @click="toggleZoom"
            >
              <ZoomOut v-if="isZoomed" class="w-5 h-5" />
              <ZoomIn v-else class="w-5 h-5" />
            </button>
            <button
              type="button"
              class="p-2.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white"
              aria-label="Close lightbox"
              @click="close"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Center Image Viewport -->
        <div
          class="flex-1 flex items-center justify-center overflow-auto py-2 cursor-pointer"
          @click="close"
        >
          <img
            :src="imageUrl"
            :alt="altText"
            :class="[
              'rounded-lg shadow-2xl transition-transform duration-200 object-contain max-h-[80vh] max-w-full',
              isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in',
            ]"
            @click.stop="toggleZoom"
          />
        </div>

        <!-- Bottom helper text -->
        <div class="text-center text-xs text-white/60">
          Tap image to zoom • Esc or tap outside to close
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
