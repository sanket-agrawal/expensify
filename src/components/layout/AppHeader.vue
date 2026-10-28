<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Sun, Moon, Sparkles } from 'lucide-vue-next';
import { useTheme } from '@/composables/useTheme';
import { APP_CONFIG } from '@/config/app';
import Avatar from '@/components/ui/Avatar.vue';

interface Props {
  tripName?: string;
  tripEmoji?: string;
  tripToken?: string;
  currentParticipant?: { id: string; name: string; colorKey?: string } | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'switch-participant'): void;
}>();

const route = useRoute();
const router = useRouter();
const { isDark, toggleTheme } = useTheme();

const isInsideTrip = computed(() => !!props.tripToken);

function goHome() {
  router.push('/');
}
</script>

<template>
  <header
    class="sticky top-0 z-30 bg-card/85 dark:bg-[#132733]/85 backdrop-blur-md border-b border-sand-200/80 dark:border-white/5 transition-colors"
  >
    <div class="max-w-4xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between">
      <!-- Brand / Trip title -->
      <div class="flex items-center gap-3 cursor-pointer select-none" @click="goHome">
        <div class="w-8 h-8 rounded-full bg-lagoon/15 text-lagoon flex items-center justify-center font-display font-bold text-base">
          {{ tripEmoji || '🏖️' }}
        </div>
        <div>
          <span class="font-display font-bold text-base sm:text-lg text-ink tracking-tight">
            {{ tripName || APP_CONFIG.appName }}
          </span>
          <span
            v-if="tripName"
            class="hidden sm:inline-block ml-2 text-xs text-ink-muted border-l border-sand-200 dark:border-white/10 pl-2"
          >
            {{ APP_CONFIG.appName }}
          </span>
        </div>
      </div>

      <!-- Desktop nav links if inside trip -->
      <nav v-if="isInsideTrip" class="hidden sm:flex items-center gap-1">
        <router-link
          :to="`/t/${tripToken}`"
          class="px-3 py-1.5 rounded-btn text-sm font-medium transition-colors"
          :class="route.path === `/t/${tripToken}` ? 'bg-sand-200/80 dark:bg-white/10 text-ink font-semibold' : 'text-ink-muted hover:text-ink'"
        >
          Dashboard
        </router-link>
        <router-link
          :to="`/t/${tripToken}/expenses`"
          class="px-3 py-1.5 rounded-btn text-sm font-medium transition-colors"
          :class="route.path.startsWith(`/t/${tripToken}/expenses`) ? 'bg-sand-200/80 dark:bg-white/10 text-ink font-semibold' : 'text-ink-muted hover:text-ink'"
        >
          Expenses
        </router-link>
        <router-link
          :to="`/t/${tripToken}/settle`"
          class="px-3 py-1.5 rounded-btn text-sm font-medium transition-colors"
          :class="route.path.startsWith(`/t/${tripToken}/settle`) ? 'bg-sand-200/80 dark:bg-white/10 text-ink font-semibold' : 'text-ink-muted hover:text-ink'"
        >
          Settle up
        </router-link>
      </nav>

      <!-- Right controls: Participant Selector & Theme Toggle -->
      <div class="flex items-center gap-2">
        <!-- Participant selector pill -->
        <button
          v-if="isInsideTrip && currentParticipant"
          type="button"
          class="flex items-center gap-2 py-1 px-2.5 rounded-chip bg-sand-200/70 dark:bg-white/10 hover:bg-sand-200 dark:hover:bg-white/15 transition-all active:scale-95 text-xs font-medium text-ink"
          title="Switch participant"
          @click="emit('switch-participant')"
        >
          <Avatar
            :name="currentParticipant.name"
            :color-key="currentParticipant.colorKey"
            size="sm"
          />
          <span class="max-w-[80px] sm:max-w-[120px] truncate">{{ currentParticipant.name }}</span>
        </button>

        <button
          v-else-if="isInsideTrip"
          type="button"
          class="flex items-center gap-1.5 py-1 px-2.5 rounded-chip bg-sunshine/20 text-[#8F6200] dark:text-sunshine text-xs font-semibold hover:brightness-95 transition-all"
          @click="emit('switch-participant')"
        >
          <Sparkles class="w-3.5 h-3.5" />
          <span>Who are you?</span>
        </button>

        <!-- Theme toggle -->
        <button
          type="button"
          class="p-2 rounded-full text-ink-muted hover:text-ink hover:bg-sand-200/50 dark:hover:bg-white/5 transition-colors"
          :aria-label="isDark ? 'Switch to light mode' : 'Switch to night mode'"
          @click="toggleTheme"
        >
          <Sun v-if="isDark" class="w-4.5 h-4.5 text-sunshine" />
          <Moon v-else class="w-4.5 h-4.5" />
        </button>
      </div>
    </div>
  </header>
</template>
