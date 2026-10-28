<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Plus, Compass, ArrowRight } from 'lucide-vue-next';
import { APP_CONFIG } from '@/config/app';
import { useTripStore } from '@/stores/tripStore';
import Button from '@/components/ui/Button.vue';
import Card from '@/components/ui/Card.vue';
import EmptyState from '@/components/ui/EmptyState.vue';

const router = useRouter();
const tripStore = useTripStore();

onMounted(() => {
  tripStore.loadRecentTrips();
});

function goToTrip(token: string) {
  router.push(`/t/${token}`);
}

function createNewTrip() {
  router.push('/new');
}
</script>

<template>
  <div class="max-w-xl mx-auto px-4 py-8 sm:py-12">
    <!-- Hero Header -->
    <div class="text-center mb-8 sm:mb-12">
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-lagoon/15 text-3xl mb-4 select-none">
        🏖️
      </div>
      <h1 class="font-display text-3xl sm:text-4xl font-bold text-ink tracking-tight mb-2">
        {{ APP_CONFIG.appName }}
      </h1>
      <p class="text-ink-muted text-base max-w-sm mx-auto">
        {{ APP_CONFIG.appTagline }}. Share the bills, keep the holiday chill.
      </p>

      <div class="mt-6 flex justify-center">
        <Button variant="primary" size="lg" @click="createNewTrip">
          <template #prefix>
            <Plus class="w-5 h-5 stroke-[2.5]" />
          </template>
          Plan a new trip
        </Button>
      </div>
    </div>

    <!-- Recent trips on this device -->
    <div class="space-y-4">
      <div class="flex items-center justify-between px-1">
        <h2 class="font-display text-lg font-semibold text-ink flex items-center gap-2">
          <Compass class="w-4.5 h-4.5 text-deep-sea dark:text-sky" />
          Your trips
        </h2>
        <span class="text-xs text-ink-muted">Saved on this device</span>
      </div>

      <div v-if="tripStore.recentTrips.length > 0" class="space-y-3">
        <Card
          v-for="trip in tripStore.recentTrips"
          :key="trip.token"
          hover
          padding="sm"
          class="flex items-center justify-between"
          @click="goToTrip(trip.token)"
        >
          <div class="flex items-center gap-3 min-w-0">
            <span class="text-2xl shrink-0 select-none">{{ trip.emoji || '🌴' }}</span>
            <div class="min-w-0">
              <h3 class="font-display font-semibold text-ink text-base truncate">
                {{ trip.name }}
              </h3>
              <p class="text-xs text-ink-muted">
                Visited {{ trip.lastVisited }} • {{ trip.currency }}
              </p>
            </div>
          </div>
          <ArrowRight class="w-4.5 h-4.5 text-ink-muted shrink-0" />
        </Card>
      </div>

      <EmptyState
        v-else
        title="No trips yet"
        description="Create your first trip or open a link shared by your travel buddies."
      >
        <template #action>
          <Button variant="secondary" size="sm" @click="createNewTrip">
            Create trip
          </Button>
        </template>
      </EmptyState>
    </div>
  </div>
</template>
