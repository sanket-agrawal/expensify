import { Storage } from '@google-cloud/storage';
import { validationError } from './errors.js';

const ALLOWED_CONTENT_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

let storageInstance: Storage | null = null;

/**
 * Checks whether valid Google Cloud service account credentials
 * (with client_email and private_key) and a real GCS bucket are configured.
 */
export function hasValidGcpCredentials(): boolean {
  const base64Key = process.env.GCP_SERVICE_ACCOUNT_JSON_BASE64;
  const bucket = process.env.GCS_BUCKET;
  if (!base64Key || !bucket || bucket.includes('placeholder')) {
    return false;
  }

  try {
    const jsonStr = Buffer.from(base64Key, 'base64').toString('utf8');
    const credentials = JSON.parse(jsonStr);
    return Boolean(
      credentials.client_email &&
      credentials.private_key &&
      typeof credentials.private_key === 'string' &&
      credentials.private_key.includes('PRIVATE KEY')
    );
  } catch {
    return false;
  }
}

function getStorage(): Storage {
  if (storageInstance) return storageInstance;

  const base64Key = process.env.GCP_SERVICE_ACCOUNT_JSON_BASE64;
  if (!base64Key) {
    throw new Error('GCP_SERVICE_ACCOUNT_JSON_BASE64 is not defined.');
  }

  try {
    const jsonStr = Buffer.from(base64Key, 'base64').toString('utf8');
    const credentials = JSON.parse(jsonStr);
    storageInstance = new Storage({
      credentials,
      projectId: credentials.project_id,
    });
    return storageInstance;
  } catch (err) {
    throw new Error(`Failed to initialize Google Cloud Storage: ${(err as Error).message}`);
  }
}

function getBucketName(): string {
  const bucket = process.env.GCS_BUCKET;
  if (!bucket) {
    throw new Error('GCS_BUCKET environment variable is not defined.');
  }
  return bucket;
}

export interface SignedUploadUrlResult {
  uploadUrl: string;
  objectKey: string;
}

/**
 * Generates a V4 signed PUT upload URL for direct browser-to-GCS upload.
 * If GCP credentials are mock or placeholder in dev, returns the local upload endpoint.
 */
export async function generateSignedUploadUrl(
  tripId: string,
  filename: string,
  contentType: string,
  sizeBytes: number
): Promise<SignedUploadUrlResult> {
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    throw validationError(
      `Unsupported file type '${contentType}'. Allowed types: jpeg, png, webp, heic.`
    );
  }

  if (sizeBytes > MAX_FILE_SIZE) {
    throw validationError('File size exceeds the 10MB maximum limit.');
  }

  const cleanExt = filename.includes('.')
    ? filename.substring(filename.lastIndexOf('.')).toLowerCase()
    : '.jpg';

  const randomPart = Math.random().toString(36).substring(2, 10);
  const timestamp = Date.now();
  const objectKey = `trips/${tripId}/${timestamp}-${randomPart}${cleanExt}`;

  // When live GCP credentials exist, use Google Cloud Storage V4 signed URL
  if (hasValidGcpCredentials()) {
    const storage = getStorage();
    const bucket = storage.bucket(getBucketName());
    const file = bucket.file(objectKey);

    const [uploadUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType,
    });

    return {
      uploadUrl,
      objectKey,
    };
  }

  // Local dev mode fallback when GCS credentials are placeholder or not yet provided
  return {
    uploadUrl: `/api/trips/${encodeURIComponent(tripId)}/uploads/local?key=${encodeURIComponent(objectKey)}`,
    objectKey,
  };
}

/**
 * Generates a short-lived V4 signed GET URL to view a private bill photo.
 * If in dev mode, returns the local photo endpoint.
 */
export async function generateSignedPhotoUrl(
  tripId: string,
  objectKey: string,
  alternateTripId?: string
): Promise<string> {
  // Ensure the object key belongs to this trip
  const prefix1 = `trips/${tripId}/`;
  const prefix2 = alternateTripId ? `trips/${alternateTripId}/` : '';
  if (!objectKey.startsWith(prefix1) && (!prefix2 || !objectKey.startsWith(prefix2))) {
    throw validationError('Object key does not belong to this trip.');
  }

  if (hasValidGcpCredentials()) {
    const storage = getStorage();
    const bucket = storage.bucket(getBucketName());
    const file = bucket.file(objectKey);

    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
    });

    return url;
  }

  // Local dev mode fallback
  return `/api/trips/${encodeURIComponent(tripId)}/uploads/local?key=${encodeURIComponent(objectKey)}`;
}
