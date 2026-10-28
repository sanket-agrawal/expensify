import { ref } from 'vue';

export interface ToastItem {
  id: string;
  message: string;
  type?: 'info' | 'success' | 'error';
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

const toasts = ref<ToastItem[]>([]);

export function useToast() {
  function show(toast: Omit<ToastItem, 'id'>) {
    const id = Math.random().toString(36).substring(2, 9);
    const item: ToastItem = {
      id,
      type: 'info',
      duration: 4000,
      ...toast,
    };

    toasts.value.push(item);

    if (item.duration && item.duration > 0) {
      setTimeout(() => {
        dismiss(id);
      }, item.duration);
    }

    return id;
  }

  function success(message: string, action?: ToastItem['action']) {
    return show({ message, type: 'success', action });
  }

  function error(message: string, action?: ToastItem['action']) {
    return show({ message, type: 'error', duration: 6000, action });
  }

  function info(message: string, action?: ToastItem['action']) {
    return show({ message, type: 'info', action });
  }

  function dismiss(id: string) {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  return {
    toasts,
    show,
    success,
    error,
    info,
    dismiss,
  };
}
