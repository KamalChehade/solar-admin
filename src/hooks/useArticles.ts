import { useCallback, useEffect, useState } from 'react';
import articlesApi from '../api/articles';
import type { Article, ArticleListResult } from '../types/article';

export default function useArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async (limit = 20, offset = 0) => {
    setLoading(true);
    setError(null);
    try {
      const res: ArticleListResult = await articlesApi.list(limit, offset);
      setArticles(res.rows || []);
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
      const res = await articlesApi.getById(id);
      return res.article;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (payload: any = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await articlesApi.create(payload);
      await fetch();
      return res.article;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetch]);

  const update = useCallback(async (id: number, payload: any = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await articlesApi.update(id, payload);
      await fetch();
      return res.article;
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
      const res = await articlesApi.delete(id);
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
    fetch();
  }, [fetch]);

  return { articles, count, loading, error, fetch, getById, create, update, remove };
}
