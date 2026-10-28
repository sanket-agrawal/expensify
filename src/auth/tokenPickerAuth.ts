import type { AuthProvider, UserActor } from './types';

const STORAGE_PREFIX = 'tripsplit_participant_';

export class TokenPickerAuth implements AuthProvider {
  name = 'token-picker';

  getCurrentUser(tripToken: string): UserActor | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${tripToken}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserActor;
    } catch {
      return null;
    }
  }

  setCurrentUser(tripToken: string, user: UserActor): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`${STORAGE_PREFIX}${tripToken}`, JSON.stringify(user));
  }

  clearCurrentUser(tripToken: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(`${STORAGE_PREFIX}${tripToken}`);
  }
}

export const defaultAuthProvider: AuthProvider = new TokenPickerAuth();
