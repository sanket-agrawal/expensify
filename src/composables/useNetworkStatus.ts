import { ref, onMounted, onUnmounted } from 'vue';
import { useToast } from './useToast';

const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true);

export function useNetworkStatus() {
  const { error: toastError, success: toastSuccess } = useToast();

  function onOnline() {
    isOnline.value = true;
    toastSuccess('Back online! Syncing latest data...');
  }

  function onOffline() {
    isOnline.value = false;
    toastError('You are currently offline. Changes will sync when reconnected.');
  }

  onMounted(() => {
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
  });

  onUnmounted(() => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  });

  return {
    isOnline,
  };
}
