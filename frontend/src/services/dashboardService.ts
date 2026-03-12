import api from './api';
import { DashboardStats, UserOverview, ApiResponse } from '../types';

interface UsersOverviewResponse {
  users: UserOverview[];
  total: number;
  page: number;
  totalPages: number;
}

export const dashboardService = {
  getStats: async (month?: number, year?: number) => {
    const params = new URLSearchParams();
    if (month) params.append('month', String(month));
    if (year) params.append('year', String(year));
    const query = params.toString();
    const response = await api.get<ApiResponse<DashboardStats>>(
      `/dashboard/stats${query ? `?${query}` : ''}`
    );
    return response.data;
  },

  getUsersOverview: async (page = 1, limit = 20, month?: number, year?: number) => {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(limit));
    if (month) params.append('month', String(month));
    if (year) params.append('year', String(year));
    
    const response = await api.get<ApiResponse<UsersOverviewResponse>>(
      `/dashboard/users-overview?${params.toString()}`
    );
    return response.data;
  },

  getRevenue: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get<ApiResponse<any>>(`/dashboard/revenue?${params}`);
    return response.data;
  },
};

export default dashboardService;
