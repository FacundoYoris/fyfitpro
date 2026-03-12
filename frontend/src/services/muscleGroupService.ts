import api from './api';
import { ApiResponse, MuscleGroup } from '../types';

export const muscleGroupService = {
  getGroups: async () => {
    const response = await api.get<ApiResponse<MuscleGroup[]>>('/muscle-groups');
    return response.data;
  },

  createGroup: async (name: string) => {
    const response = await api.post<ApiResponse<MuscleGroup>>('/muscle-groups', { name });
    return response.data;
  },

  updateGroup: async (id: number, name: string) => {
    const response = await api.put<ApiResponse<MuscleGroup>>(`/muscle-groups/${id}`, { name });
    return response.data;
  },

  deleteGroup: async (id: number) => {
    const response = await api.delete<ApiResponse<void>>(`/muscle-groups/${id}`);
    return response.data;
  },
};

export default muscleGroupService;
