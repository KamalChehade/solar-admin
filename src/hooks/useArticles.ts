import { useCallback, useEffect, useState } from 'react';
import articlesApi from '../api/articles';
import type { Article, ArticleListResult } from '../types/article';

 
export default function useArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /* -----------------------------------------------
     FETCH LIST (Paginated)
  ------------------------------------------------ */
  // remember last used pagination params so create/update/delete can refresh current page
  const lastParams = { limit: 20, offset: 0 } as { limit: number; offset: number };

  const fetch = useCallback(async (limit?: number, offset?: number) => {
    const l = typeof limit === 'number' ? limit : lastParams.limit;
    const o = typeof offset === 'number' ? offset : lastParams.offset;
    // update remembered params
    lastParams.limit = l;
    lastParams.offset = o;

    setLoading(true);
    setError(null);
    try {
      const res: ArticleListResult = await articlesApi.list(l, o);
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

  /* -----------------------------------------------
     GET BY ID
  ------------------------------------------------ */
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

  /* -----------------------------------------------
     CREATE ARTICLE
     - payload must include translations array,
       each with { lang, title, excerpt, content, author }
  ------------------------------------------------ */
  const create = useCallback(
    async (payload: any = {}) => {
      setLoading(true);
      setError(null);
      try {
        const res = await articlesApi.create(payload);
        // Refresh list after creation
        await fetch();
        return res.article;
      } catch (err: any) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetch]
  );

  /* -----------------------------------------------
     UPDATE ARTICLE
     - same structure: translations contain author
  ------------------------------------------------ */
  const update = useCallback(
    async (id: number, payload: any = {}) => {
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
    },
    [fetch]
  );

  /* -----------------------------------------------
     DELETE ARTICLE
  ------------------------------------------------ */
  const remove = useCallback(
    async (id: number) => {
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
    },
    [fetch]
  );

  /* -----------------------------------------------
     AUTO FETCH INITIAL LIST
  ------------------------------------------------ */
  useEffect(() => {
    fetch();
  }, [fetch]);

  /* -----------------------------------------------
     RETURN HOOK INTERFACE
  ------------------------------------------------ */
  return {
    articles,
    count,
    loading,
    error,
    fetch,
    getById,
    create,
    update,
    remove,
  };
}
