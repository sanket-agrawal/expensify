export interface UserActor {
  id: string;
  name: string;
  email?: string;
  colorKey?: string;
}

export interface AuthProvider {
  name: string;
  getCurrentUser(tripToken: string): UserActor | null;
  setCurrentUser(tripToken: string, user: UserActor): void;
  clearCurrentUser(tripToken: string): void;
}
