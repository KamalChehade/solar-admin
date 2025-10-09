import axiosClient from './axiosClient';
import type { Category, CategoryListResult } from '../types/category';

export const categoriesApi = {
  list: async (limit = 20000000, offset = 0): Promise<CategoryListResult> => {
    try {
  const res = await axiosClient.get('categories', { params: { limit, offset } });
      return res.data;
    } catch (err) {
      console.error('[categoriesApi] GET error', err);
      throw err;
    }
  },
  getById: async (id: number): Promise<{ category: Category }> => {
    try {
  const res = await axiosClient.get(`categories/${id}`);
      return res.data;
    } catch (err) {
      console.error('[categoriesApi] GET by id error', err);
      throw err;
    }
  },
  create: async (payload: { translations?: any[] } = {}): Promise<{ category: Category }> => {
    try {
  const res = await axiosClient.post('categories', payload);
      return res.data;
    } catch (err) {
      console.error('[categoriesApi] CREATE error', err);
      throw err;
    }
  },
  update: async (id: number, payload: { translations?: any[] } = {}): Promise<{ category: Category }> => {
    try {
  const res = await axiosClient.put(`categories/${id}`, payload);
      return res.data;
    } catch (err) {
      console.error('[categoriesApi] UPDATE error', err);
      throw err;
    }
  },
  delete: async (id: number): Promise<{ success: boolean; message?: string }> => {
    try {
  const res = await axiosClient.delete(`categories/${id}`);
      return res.data;
    } catch (err) {
      console.error('[categoriesApi] DELETE error', err);
      throw err;
    }
  },
};

export default categoriesApi;
