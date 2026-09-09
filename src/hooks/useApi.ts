/**
 * TBB OS — Custom React Hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '../api/client';
import { message } from 'antd';

/**
 * Generic data fetching hook with pagination support
 */
export function useApi<T>(
  endpoint: string,
  params?: Record<string, any>,
  deps: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<T>(endpoint, params);
      setData(response.data || null);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to fetch data';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [endpoint, JSON.stringify(params), ...deps]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook for form submissions
 */
export function useSubmit<T>() {
  const [loading, setLoading] = useState(false);

  const submit = async (
    method: 'POST' | 'PUT' | 'PATCH',
    endpoint: string,
    data: any,
    onSuccess?: (result: T) => void
  ) => {
    setLoading(true);
    try {
      let response;
      if (method === 'POST') {
        response = await api.post<T>(endpoint, data);
      } else {
        response = await api.put<T>(endpoint, data);
      }
      if (response.success) {
        message.success(response.message || 'Success');
        onSuccess?.(response.data as T);
      }
      return response;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Operation failed';
      message.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { submit, loading };
}
