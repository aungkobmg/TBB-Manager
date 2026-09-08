/**
 * TBB OS — API Client
 * Centralized HTTP client for all API requests
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

class ApiError extends Error {
  status: number;
  details?: any;

  constructor(message: string, status: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    credentials: 'include', // Send cookies for session auth
    ...options,
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.error || data.message || 'Request failed',
        response.status,
        data.details
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Network error
    throw new ApiError('Network error. Please check your connection.', 0);
  }
}

// Convenience methods
export const api = {
  get: <T = any>(endpoint: string, params?: Record<string, any>) => {
    const queryString = params
      ? '?' + new URLSearchParams(
          Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
        ).toString()
      : '';
    return request<T>(`${endpoint}${queryString}`);
  },

  post: <T = any>(endpoint: string, data?: any) => {
    return request<T>(endpoint, {
      method: 'POST',
      body: data,
    });
  },

  put: <T = any>(endpoint: string, data?: any) => {
    return request<T>(endpoint, {
      method: 'PUT',
      body: data,
    });
  },

  delete: <T = any>(endpoint: string) => {
    return request<T>(endpoint, {
      method: 'DELETE',
    });
  },
};

export { ApiError };
export type { ApiResponse };
