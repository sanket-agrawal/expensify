import { ref } from 'vue';
import type { UserActor } from '@/auth/types';
import { defaultAuthProvider } from '@/auth/tokenPickerAuth';

const currentUser = ref<UserActor | null>(null);
const currentTripToken = ref<string>('');

export function useCurrentUser() {
  function initUserForTrip(token: string) {
    currentTripToken.value = token;
    currentUser.value = defaultAuthProvider.getCurrentUser(token);
  }

  function setCurrentUser(user: UserActor) {
    if (!currentTripToken.value) return;
    defaultAuthProvider.setCurrentUser(currentTripToken.value, user);
    currentUser.value = user;
  }

  function clearCurrentUser() {
    if (!currentTripToken.value) return;
    defaultAuthProvider.clearCurrentUser(currentTripToken.value);
    currentUser.value = null;
  }

  return {
    currentUser,
    initUserForTrip,
    setCurrentUser,
    clearCurrentUser,
  };
}
