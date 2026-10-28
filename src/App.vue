<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import AppHeader from '@/components/layout/AppHeader.vue';
import BottomNav from '@/components/layout/BottomNav.vue';
import Toast from '@/components/ui/Toast.vue';
import ParticipantPickerModal from '@/components/trip/ParticipantPickerModal.vue';
import { useTripStore } from '@/stores/tripStore';
import { useCurrentUser } from '@/composables/useCurrentUser';
import { useNetworkStatus } from '@/composables/useNetworkStatus';

const route = useRoute();
const tripStore = useTripStore();
const { currentUser } = useCurrentUser();
useNetworkStatus();

const showGlobalPicker = ref(false);

const tripToken = computed(() => {
  const token = route.params.token;
  return typeof token === 'string' ? token : '';
});

const isAddOrEditExpense = computed(() => {
  return route.name === 'add-expense' || route.name === 'edit-expense';
});
</script>

<template>
  <div class="min-h-screen min-h-[100dvh] flex flex-col bg-sand text-ink bg-grain">
    <!-- Header -->
    <AppHeader
      :trip-name="tripStore.currentTrip?.name"
      :trip-emoji="tripStore.currentTrip?.emoji"
      :trip-token="tripToken"
      :current-participant="currentUser"
      @switch-participant="showGlobalPicker = true"
    />

    <!-- Main Viewport -->
    <div class="flex-1 flex flex-col">
      <router-view v-slot="{ Component }">
        <Transition
          name="page"
          mode="out-in"
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="opacity-0 translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-1"
        >
          <component :is="Component" />
        </Transition>
      </router-view>
    </div>

    <!-- Mobile Bottom Navigation (shown inside trip, unless adding an expense) -->
    <BottomNav
      v-if="tripToken && !isAddOrEditExpense"
      :trip-token="tripToken"
    />

    <!-- Global Participant Switcher Modal -->
    <ParticipantPickerModal
      v-if="tripStore.currentTrip"
      v-model:open="showGlobalPicker"
      :participants="tripStore.currentTrip.participants"
    />

    <!-- Toast Notifications Layer -->
    <Toast />
  </div>
</template>
