<script setup lang="ts">
import { ref } from 'vue';
import { Camera, Plus, Trash2, RefreshCw, AlertCircle, Loader2 } from 'lucide-vue-next';
import Lightbox from './Lightbox.vue';

export interface PhotoItem {
  id: string;
  previewUrl: string;
  objectKey?: string;
  progress?: number; // 0 to 100
  status: 'pending' | 'uploading' | 'done' | 'error';
  errorMessage?: string;
  file?: File;
}

interface Props {
  photos: PhotoItem[];
  editable?: boolean;
  maxPhotos?: number;
}

withDefaults(defineProps<Props>(), {
  editable: true,
  maxPhotos: 5,
});

const emit = defineEmits<{
  (e: 'add', files: FileList | File[]): void;
  (e: 'remove', photoId: string): void;
  (e: 'retry', photoId: string): void;
}>();

const fileInputRef = ref<HTMLInputElement | null>(null);
const activeLightboxUrl = ref<string | null>(null);

function triggerFileInput() {
  fileInputRef.value?.click();
}

function onFileSelected(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    emit('add', target.files);
    target.value = ''; // Reset for re-selection
  }
}

function openLightbox(url: string) {
  activeLightboxUrl.value = url;
}
</script>

<template>
  <div class="space-y-3">
    <!-- Grid of thumbnails -->
    <div class="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
      <div
        v-for="photo in photos"
        :key="photo.id"
        class="group relative aspect-square rounded-btn overflow-hidden bg-sand-200/50 dark:bg-white/5 border border-sand-200 dark:border-white/10"
      >
        <!-- Image -->
        <img
          :src="photo.previewUrl"
          alt="Bill photo"
          class="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
          @click="openLightbox(photo.previewUrl)"
        />

        <!-- Uploading overlay -->
        <div
          v-if="photo.status === 'uploading' || photo.status === 'pending'"
          class="absolute inset-0 bg-ink/60 flex flex-col items-center justify-center p-2 text-white"
        >
          <Loader2 class="w-5 h-5 animate-spin mb-1" />
          <span class="text-[10px] font-semibold">{{ photo.progress ?? 0 }}%</span>
          <div class="w-4/5 h-1 bg-white/20 rounded-full mt-1 overflow-hidden">
            <div
              class="h-full bg-lagoon transition-all duration-150"
              :style="{ width: `${photo.progress ?? 0}%` }"
            />
          </div>
        </div>

        <!-- Error overlay with retry -->
        <div
          v-else-if="photo.status === 'error'"
          class="absolute inset-0 bg-coral/80 flex flex-col items-center justify-center p-2 text-white text-center"
        >
          <AlertCircle class="w-5 h-5 mb-1" />
          <span class="text-[10px] font-medium leading-tight mb-1">Failed</span>
          <button
            v-if="editable"
            type="button"
            class="flex items-center gap-1 text-[11px] font-semibold bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded"
            @click.stop="emit('retry', photo.id)"
          >
            <RefreshCw class="w-3 h-3" /> Retry
          </button>
        </div>

        <!-- Remove button -->
        <button
          v-if="editable && photo.status !== 'uploading'"
          type="button"
          class="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-coral transition-colors"
          title="Remove photo"
          aria-label="Remove photo"
          @click.stop="emit('remove', photo.id)"
        >
          <Trash2 class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Add photo button -->
      <button
        v-if="editable && photos.length < maxPhotos"
        type="button"
        class="aspect-square flex flex-col items-center justify-center rounded-btn border-2 border-dashed border-sand-200 dark:border-white/20 hover:border-lagoon hover:bg-lagoon/5 dark:hover:border-lagoon text-ink-muted hover:text-lagoon transition-all active:scale-95"
        @click="triggerFileInput"
      >
        <div class="flex items-center gap-0.5 mb-1">
          <Camera class="w-5 h-5" />
          <Plus class="w-3.5 h-3.5" />
        </div>
        <span class="text-xs font-medium">Add bill</span>
      </button>
    </div>

    <!-- Hidden file input for camera/gallery capture -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      multiple
      class="hidden"
      @change="onFileSelected"
    />

    <!-- Fullscreen lightbox -->
    <Lightbox
      :open="!!activeLightboxUrl"
      :image-url="activeLightboxUrl || ''"
      @close="activeLightboxUrl = null"
    />
  </div>
</template>
