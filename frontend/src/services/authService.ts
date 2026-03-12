import api from './api';
import { User, ApiResponse } from '../types';

interface LoginResponse {
  token: string;
  user: User;
}

interface UserProfile {
  user: User;
  plan: {
    id: number;
    name: string;
    price: number;
    endDate: string | null;
    daysPerWeek: number | null;
  } | null;
  routines: {
    id: number;
    name: string;
    description: string | null;
    duration: number | null;
    exercises: number;
    assignedAt: string;
  }[];
  payment: {
    amount: number;
    month: number;
    year: number;
    paymentDate: string;
  } | null;
  isPaid: boolean;
}

export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', {
      email,
      password,
    });
    if (response.data.success && response.data.data) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  getProfile: async () => {
    const response = await api.get<ApiResponse<UserProfile>>('/auth/profile');
    return response.data;
  },
};

export default authService;
