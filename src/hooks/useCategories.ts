import { useCallback, useEffect, useState } from 'react';
import categoriesApi from '../api/categories';
import type { Category, CategoryListResult } from '../types/category';

export default function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async (limit = 2000000000, offset = 0) => {
    setLoading(true);
    setError(null);
    try {
      const res: CategoryListResult = await categoriesApi.list(limit, offset);
      setCategories(res.rows || []);
      setCount(res.count || 0);
      return res;
    } catch (err: any) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getById = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await categoriesApi.getById(id);
      return res.category;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (payload: { translations?: any[] } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await categoriesApi.create(payload);
      // optimistic: refetch list
      await fetch();
      return res.category;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetch]);

  const update = useCallback(async (id: number, payload: { translations?: any[] } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await categoriesApi.update(id, payload);
      await fetch();
      return res.category;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetch]);

  const remove = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await categoriesApi.delete(id);
      await fetch();
      return res;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetch]);

  useEffect(() => {
    // initial load
    fetch();
  }, [fetch]);

  return { categories, count, loading, error, fetch, getById, create, update, remove };
}
