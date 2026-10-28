import { z } from 'zod';
import {
  type CreateTripInput,
  type Trip,
  tripSchema,
} from '@shared/schemas/trip';
import {
  type CreateExpenseInput,
  type UpdateExpenseInput,
  type Expense,
  expenseSchema,
} from '@shared/schemas/expense';
import {
  type CreateSettlementInput,
  type Settlement,
  settlementSchema,
} from '@shared/schemas/settlement';

export class ApiClientError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode: number) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

async function request<T>(
  url: string,
  options: RequestInit = {},
  actorId?: string
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  if (actorId) {
    headers.set('x-participant-id', actorId);
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const errorCode = typeof data === 'object' && data?.error?.code ? data.error.code : 'API_ERROR';
    const errorMessage = typeof data === 'object' && data?.error?.message ? data.error.message : (typeof data === 'string' ? data : res.statusText);
    throw new ApiClientError(errorCode, errorMessage, res.status);
  }

  return data as T;
}

export const apiClient = {
  /**
   * Create a new trip (Stored directly in MongoDB)
   */
  async createTrip(input: CreateTripInput): Promise<{ trip: Trip; accessToken: string }> {
    const res = await request<{ trip: unknown; accessToken: string }>('/api/trips', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return {
      trip: tripSchema.parse(res.trip),
      accessToken: res.accessToken,
    };
  },

  /**
   * Fetch trip by accessToken from MongoDB
   */
  async getTrip(token: string): Promise<{ trip: Trip }> {
    const res = await request<{ trip: unknown }>(`/api/trips/${encodeURIComponent(token)}`);
    return {
      trip: tripSchema.parse(res.trip),
    };
  },

  /**
   * List all active expenses for a trip from MongoDB
   */
  async getExpenses(token: string): Promise<{ expenses: Expense[] }> {
    const res = await request<{ expenses: unknown[] }>(
      `/api/trips/${encodeURIComponent(token)}/expenses`
    );
    const parsedExpenses = z.array(expenseSchema).parse(res.expenses);
    return { expenses: parsedExpenses };
  },

  /**
   * Create an expense in MongoDB
   */
  async createExpense(
    token: string,
    input: CreateExpenseInput,
    actorId?: string
  ): Promise<{ expense: Expense }> {
    const res = await request<{ expense: unknown }>(
      `/api/trips/${encodeURIComponent(token)}/expenses`,
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
      actorId
    );
    return {
      expense: expenseSchema.parse(res.expense),
    };
  },

  /**
   * Update an expense in MongoDB
   */
  async updateExpense(
    token: string,
    id: string,
    input: UpdateExpenseInput,
    actorId?: string
  ): Promise<{ success: boolean; expense: Expense }> {
    const res = await request<{ success: boolean; expense: unknown }>(
      `/api/trips/${encodeURIComponent(token)}/expenses/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(input),
      },
      actorId
    );
    return {
      success: res.success,
      expense: expenseSchema.parse(res.expense),
    };
  },

  /**
   * Soft delete an expense in MongoDB
   */
  async deleteExpense(
    token: string,
    id: string,
    actorId?: string
  ): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(
      `/api/trips/${encodeURIComponent(token)}/expenses/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
      },
      actorId
    );
  },

  /**
   * Get all recorded settlements for a trip from MongoDB
   */
  async getSettlements(token: string): Promise<{ settlements: Settlement[] }> {
    const res = await request<{ settlements: unknown[] }>(
      `/api/trips/${encodeURIComponent(token)}/settlements`
    );
    return {
      settlements: z.array(settlementSchema).parse(res.settlements),
    };
  },

  /**
   * Record a settlement payment in MongoDB
   */
  async createSettlement(
    token: string,
    input: CreateSettlementInput,
    actorId?: string
  ): Promise<{ settlement: Settlement }> {
    const res = await request<{ settlement: unknown }>(
      `/api/trips/${encodeURIComponent(token)}/settlements`,
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
      actorId
    );
    return {
      settlement: settlementSchema.parse(res.settlement),
    };
  },

  /**
   * Request a V4 signed PUT upload URL from the server
   */
  async getUploadSignedUrl(
    token: string,
    data: { filename: string; contentType: string; size: number }
  ): Promise<{ uploadUrl: string; objectKey: string }> {
    return request<{ uploadUrl: string; objectKey: string }>(
      `/api/trips/${encodeURIComponent(token)}/uploads/sign`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  /**
   * Request a short-lived signed GET URL to view a private bill photo
   */
  async getPhotoSignedUrl(token: string, objectKey: string): Promise<{ url: string }> {
    return request<{ url: string }>(
      `/api/trips/${encodeURIComponent(token)}/photos/sign?key=${encodeURIComponent(objectKey)}`
    );
  },

  /**
   * Uploads file directly from the browser to GCS via the V4 signed PUT URL.
   * Tracks upload progress via XMLHttpRequest.
   */
  uploadDirectToGcs(
    signedPutUrl: string,
    fileBlob: Blob | File,
    contentType: string,
    onProgress?: (percent: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', signedPutUrl);
      xhr.setRequestHeader('Content-Type', contentType);

      if (onProgress && xhr.upload) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Direct GCS upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during direct photo upload'));
      xhr.send(fileBlob);
    });
  },
};
