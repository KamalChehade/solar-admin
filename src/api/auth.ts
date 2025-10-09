import axiosClient from './axiosClient';

export type AuthUser = {
  id: string;
  name?: string;
  email?: string;
  role?: 'Admin' | 'Publisher' | string;
};

export const authApi = {
  login: async (email: string, password: string) => {
    const res = await axiosClient.post('auth/login', { email, password });
    return res.data;
  },
  signup: async (name: string, email: string, password: string, roleId: number) => {
    const res = await axiosClient.post('auth/signup', { name, email, password, roleId });
    return res.data;
  },
};

export default authApi;
