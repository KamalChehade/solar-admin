import axiosClient from './axiosClient';
import type { Article, ArticleListResult } from '../types/article';

export const articlesApi = {
  list: async (limit = 20000000, offset = 0): Promise<ArticleListResult> => {
    try {
      const res = await axiosClient.get('articles', { params: { limit, offset } });
      return res.data;
    } catch (err) {
      console.error('[articlesApi] LIST error', err);
      throw err;
    }
  },
  getById: async (id: number): Promise<{ article: Article }> => {
    try {
      const res = await axiosClient.get(`articles/${id}`);
      return res.data;
    } catch (err) {
      console.error('[articlesApi] GET error', err);
      throw err;
    }
  },
  create: async (payload: any = {}): Promise<{ article: Article }> => {
    try {
      // backend accepts multipart/form-data for cover_image; caller should compose FormData when needed
      const res = await axiosClient.post('articles', payload);
      return res.data;
    } catch (err) {
      console.error('[articlesApi] CREATE error', err);
      throw err;
    }
  },
  update: async (id: number, payload: any = {}): Promise<{ article: Article }> => {
    try {
      const res = await axiosClient.put(`articles/${id}`, payload);
      return res.data;
    } catch (err) {
      console.error('[articlesApi] UPDATE error', err);
      throw err;
    }
  },
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
