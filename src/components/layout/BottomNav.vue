<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { LayoutDashboard, ReceiptText, Plus, HandCoins } from 'lucide-vue-next';

interface Props {
  tripToken: string;
}

const props = defineProps<Props>();
const route = useRoute();
const router = useRouter();

const currentPath = computed(() => route.path);

const navItems = computed(() => [
  {
    label: 'Dashboard',
    path: `/t/${props.tripToken}`,
    icon: LayoutDashboard,
  },
  {
    label: 'Expenses',
    path: `/t/${props.tripToken}/expenses`,
    icon: ReceiptText,
  },
  {
    label: 'Settle up',
    path: `/t/${props.tripToken}/settle`,
    icon: HandCoins,
  },
]);

function goToAddExpense() {
  router.push(`/t/${props.tripToken}/expenses/new`);
}
</script>

<template>
  <nav
    class="fixed bottom-0 inset-x-0 z-40 bg-card/95 dark:bg-[#132733]/95 backdrop-blur-md border-t border-sand-200/80 dark:border-white/10 pb-safe sm:hidden"
    aria-label="Mobile navigation"
  >
    <div class="flex items-center justify-around h-16 px-2 relative">
      <!-- Dashboard -->
      <router-link
        :to="navItems[0]!.path"
        class="flex flex-col items-center justify-center flex-1 py-1 text-xs transition-colors"
        :class="currentPath === navItems[0]!.path ? 'text-lagoon font-semibold' : 'text-ink-muted hover:text-ink'"
      >
        <component :is="navItems[0]!.icon" class="w-5 h-5 mb-0.5" />
        <span>{{ navItems[0]!.label }}</span>
      </router-link>

      <!-- Expenses -->
      <router-link
        :to="navItems[1]!.path"
        class="flex flex-col items-center justify-center flex-1 py-1 text-xs transition-colors mr-6"
        :class="currentPath === navItems[1]!.path ? 'text-lagoon font-semibold' : 'text-ink-muted hover:text-ink'"
      >
        <component :is="navItems[1]!.icon" class="w-5 h-5 mb-0.5" />
        <span>{{ navItems[1]!.label }}</span>
      </router-link>

      <!-- Center Floating "+ Add Expense" Button -->
      <div class="absolute left-1/2 -top-5 -translate-x-1/2">
        <button
          type="button"
          class="w-13 h-13 rounded-full bg-lagoon hover:bg-lagoon-hover active:bg-lagoon-active text-white shadow-float flex items-center justify-center active:scale-95 transition-all outline-none focus-visible:ring-4 focus-visible:ring-lagoon/30"
          aria-label="Add expense"
          @click="goToAddExpense"
        >
          <Plus class="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      <!-- Spacer for center button -->
      <div class="w-8 shrink-0" aria-hidden="true" />

      <!-- Settle up -->
      <router-link
        :to="navItems[2]!.path"
        class="flex flex-col items-center justify-center flex-1 py-1 text-xs transition-colors ml-6"
        :class="currentPath === navItems[2]!.path ? 'text-lagoon font-semibold' : 'text-ink-muted hover:text-ink'"
      >
        <component :is="navItems[2]!.icon" class="w-5 h-5 mb-0.5" />
        <span>{{ navItems[2]!.label }}</span>
      </router-link>
    </div>
  </nav>
</template>
