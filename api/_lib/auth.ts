import type { IncomingMessage } from 'node:http';

export interface ApiActor {
  id: string;
  name?: string;
  authMethod: 'token-picker' | 'google-id-token';
}

/**
 * Resolves the actor calling the API.
 * Currently uses the x-participant-id request header.
 * Future extension: inspect Authorization: Bearer <google-id-token> and verify server-side.
 */
export function getActor(req: IncomingMessage): ApiActor | null {
  const participantHeader = req.headers['x-participant-id'];
  if (typeof participantHeader === 'string' && participantHeader.trim().length > 0) {
    return {
      id: participantHeader.trim(),
      authMethod: 'token-picker',
    };
  }

  // Future Google Sign-In seam:
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // const idToken = authHeader.substring(7);
    // verifyGoogleIdToken(idToken)...
  }

  return null;
}
