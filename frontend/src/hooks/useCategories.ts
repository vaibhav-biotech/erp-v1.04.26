import { useState, useCallback } from 'react';
import { buildApiUrl, fetchWithStore } from '@/lib/storeConfig';

const getAdminToken = () => {
  if (typeof window === 'undefined') return undefined;
  return localStorage.getItem('adminToken') || undefined;
};

export const useCategories = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchWithStore(buildApiUrl('/api/categories'), {
        token: getAdminToken(),
      });
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();
      return data.data || [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error fetching categories';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createCategory = useCallback(async (category: any) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchWithStore(buildApiUrl('/api/categories'), {
        method: 'POST',
        token: getAdminToken(),
        body: JSON.stringify(category),
      });
      if (!res.ok) throw new Error('Failed to create category');
      const data = await res.json();
      return data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error creating category';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCategory = useCallback(async (id: string, category: any) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchWithStore(buildApiUrl(`/api/categories/${id}`), {
        method: 'PUT',
        token: getAdminToken(),
        body: JSON.stringify(category),
      });
      if (!res.ok) throw new Error('Failed to update category');
      const data = await res.json();
      return data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error updating category';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchWithStore(buildApiUrl(`/api/categories/${id}`), {
        method: 'DELETE',
        token: getAdminToken(),
      });
      if (!res.ok) throw new Error('Failed to delete category');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error deleting category';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchCategories, createCategory, updateCategory, deleteCategory, loading, error };
};
