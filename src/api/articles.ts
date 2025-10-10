import axiosClient from './axiosClient';
import type { Article, ArticleListResult } from '../types/article';

export const articlesApi = {
  /* -----------------------------------------------
     LIST ARTICLES
  ------------------------------------------------ */
  list: async (limit = 20, offset = 0): Promise<ArticleListResult> => {
    try {
      const res = await axiosClient.get('articles', { params: { limit, offset } });
      return res.data;
    } catch (err) {
      console.error('[articlesApi] LIST error', err);
      throw err;
    }
  },

  /* -----------------------------------------------
     GET SINGLE ARTICLE
  ------------------------------------------------ */
  getById: async (id: number): Promise<{ article: Article }> => {
    try {
      const res = await axiosClient.get(`articles/${id}`);
      return res.data;
    } catch (err) {
      console.error('[articlesApi] GET error', err);
      throw err;
    }
  },

  /* -----------------------------------------------
     CREATE ARTICLE
     - accepts FormData (for image upload)
     - translations include author inside each entry
  ------------------------------------------------ */
  create: async (payload: any = {}): Promise<{ article: Article }> => {
    try {
      if (payload instanceof FormData) {
        const res = await axiosClient.post('articles', payload, { headers: { 'Content-Type': 'multipart/form-data' } });
        return res.data;
      }
      const res = await axiosClient.post('articles', payload);
      return res.data;
    } catch (err) {
      console.error('[articlesApi] CREATE error', err);
      throw err;
    }
  },

  /* -----------------------------------------------
     UPDATE ARTICLE
  ------------------------------------------------ */
  update: async (id: number, payload: any = {}): Promise<{ article: Article }> => {
    try {
      if (payload instanceof FormData) {
        const res = await axiosClient.put(`articles/${id}`, payload, { headers: { 'Content-Type': 'multipart/form-data' } });
        return res.data;
      }
      const res = await axiosClient.put(`articles/${id}`, payload);
      return res.data;
    } catch (err) {
      console.error('[articlesApi] UPDATE error', err);
      throw err;
    }
  },

  /* -----------------------------------------------
     DELETE ARTICLE
  ------------------------------------------------ */
  delete: async (id: number): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await axiosClient.delete(`articles/${id}`);
      return res.data;
    } catch (err) {
      console.error('[articlesApi] DELETE error', err);
      throw err;
    }
  },
};

export default articlesApi;