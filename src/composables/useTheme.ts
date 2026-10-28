import { ref, watchEffect } from 'vue';

const isDark = ref(false);

// Initialize theme from system or saved preference
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('tripsplit_theme');
  if (saved) {
    isDark.value = saved === 'dark';
  } else {
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
}

watchEffect(() => {
  if (typeof document !== 'undefined') {
    if (isDark.value) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('tripsplit_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('tripsplit_theme', 'light');
    }
  }
});

export function useTheme() {
  function toggleTheme() {
    isDark.value = !isDark.value;
  }

  return {
    isDark,
    toggleTheme,
  };
}
