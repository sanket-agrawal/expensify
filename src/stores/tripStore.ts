import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Trip, CreateTripInput, Participant } from '@shared/schemas/trip';
import { apiClient } from '@/lib/apiClient';

export interface RecentTripItem {
  token: string;
  name: string;
  emoji?: string;
  currency: string;
  lastVisited: string;
}

const RECENT_TRIPS_KEY = 'tripsplit_recent_trips';

export const useTripStore = defineStore('trip', () => {
  const currentTrip = ref<Trip | null>(null);
  const allTrips = ref<Trip[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const recentTrips = ref<RecentTripItem[]>([]);

  async function loadAllTrips(): Promise<Trip[]> {
    loading.value = true;
    error.value = null;
    try {
      const res = await apiClient.getTrips();
      allTrips.value = res.trips;
      return res.trips;
    } catch (err) {
      const msg = (err as Error).message || 'Failed to load trips';
      error.value = msg;
      return [];
    } finally {
      loading.value = false;
    }
  }

  function loadRecentTrips() {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(RECENT_TRIPS_KEY);
      if (raw) {
        recentTrips.value = JSON.parse(raw);
      }
    } catch {
      recentTrips.value = [];
    }
  }

  function saveRecentTrip(trip: Trip) {
    if (typeof window === 'undefined') return;
    const item: RecentTripItem = {
      token: trip.accessToken,
      name: trip.name,
      emoji: trip.emoji,
      currency: trip.currency,
      lastVisited: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
    };

    // Filter out existing and prepend
    const updated = [item, ...recentTrips.value.filter((r) => r.token !== trip.accessToken)].slice(0, 10);
    recentTrips.value = updated;
    localStorage.setItem(RECENT_TRIPS_KEY, JSON.stringify(updated));
  }

  async function fetchTrip(token: string): Promise<Trip> {
    loading.value = true;
    error.value = null;
    try {
      const res = await apiClient.getTrip(token);
      currentTrip.value = res.trip;
      saveRecentTrip(res.trip);
      return res.trip;
    } catch (err) {
      const msg = (err as Error).message || 'Failed to load trip';
      error.value = msg;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createTrip(input: CreateTripInput): Promise<{ trip: Trip; accessToken: string }> {
    loading.value = true;
    error.value = null;
    try {
      const res = await apiClient.createTrip(input);
      currentTrip.value = res.trip;
      saveRecentTrip(res.trip);
      return res;
    } catch (err) {
      const msg = (err as Error).message || 'Failed to create trip';
      error.value = msg;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function getParticipant(id: string): Participant | undefined {
    return currentTrip.value?.participants.find((p) => p.id === id);
  }

  return {
    currentTrip,
    allTrips,
    loading,
    error,
    recentTrips,
    loadRecentTrips,
    loadAllTrips,
    fetchTrip,
    createTrip,
    getParticipant,
  };
});
