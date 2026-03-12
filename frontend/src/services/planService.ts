import api from './api';
import { Plan, ApiResponse, UserPlan } from '../types';

export const planService = {
  getPlans: async () => {
    const response = await api.get<ApiResponse<Plan[]>>('/plans');
    return response.data;
  },

  getPlanById: async (id: number) => {
    const response = await api.get<ApiResponse<Plan>>(`/plans/${id}`);
    return response.data;
  },

  createPlan: async (planData: Partial<Plan>) => {
    const response = await api.post<ApiResponse<Plan>>('/plans', planData);
    return response.data;
  },

  updatePlan: async (id: number, planData: Partial<Plan>) => {
    const response = await api.put<ApiResponse<Plan>>(`/plans/${id}`, planData);
    return response.data;
  },

  deletePlan: async (id: number) => {
    const response = await api.delete<ApiResponse<void>>(`/plans/${id}`);
    return response.data;
  },

  assignPlan: async (userId: number, planId: number) => {
    const response = await api.post<ApiResponse<UserPlan>>('/plans/assign', {
      userId,
      planId,
    });
    return response.data;
  },

  getUserPlans: async (userId: number) => {
    const response = await api.get<ApiResponse<UserPlan[]>>(`/plans/user/${userId}`);
    return response.data;
  },
};

export default planService;
