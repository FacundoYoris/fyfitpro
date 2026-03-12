import api from './api';
import { User, ApiResponse } from '../types';

interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
}

interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  dni?: string;
  role?: 'admin' | 'user';
}

export const userService = {
  getUsers: async (page = 1, limit = 10, search = '', status = '') => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    
    const response = await api.get<ApiResponse<UsersResponse>>(`/users?${params}`);
    return response.data;
  },

  getUserById: async (id: number) => {
    const response = await api.get<ApiResponse<User>>(`/users/${id}`);
    return response.data;
  },

  createUser: async (userData: CreateUserPayload) => {
    const response = await api.post<ApiResponse<User>>('/users', userData);
    return response.data;
  },

  updateUser: async (id: number, userData: Partial<User>) => {
    const response = await api.put<ApiResponse<User>>(`/users/${id}`, userData);
    return response.data;
  },

  deleteUser: async (id: number) => {
    const response = await api.delete<ApiResponse<void>>(`/users/${id}`);
    return response.data;
  },

  toggleUserStatus: async (id: number) => {
    const response = await api.patch<ApiResponse<{ isActive: boolean }>>(`/users/${id}/status`);
    return response.data;
  },
};

export default userService;
