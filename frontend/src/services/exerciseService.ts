import api from './api';
import { Exercise, ApiResponse } from '../types';

export const exerciseService = {
  getExercises: async (muscleGroup?: string) => {
    const params = muscleGroup ? `?muscleGroup=${muscleGroup}` : '';
    const response = await api.get<ApiResponse<Exercise[]>>(`/exercises${params}`);
    return response.data;
  },

  getExerciseById: async (id: number) => {
    const response = await api.get<ApiResponse<Exercise>>(`/exercises/${id}`);
    return response.data;
  },

  createExercise: async (exerciseData: Partial<Exercise>) => {
    const response = await api.post<ApiResponse<Exercise>>('/exercises', exerciseData);
    return response.data;
  },

  updateExercise: async (id: number, exerciseData: Partial<Exercise>) => {
    const response = await api.put<ApiResponse<Exercise>>(`/exercises/${id}`, exerciseData);
    return response.data;
  },

  deleteExercise: async (id: number) => {
    const response = await api.delete<ApiResponse<void>>(`/exercises/${id}`);
    return response.data;
  },
};

export default exerciseService;
