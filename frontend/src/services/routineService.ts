import api from './api';
import { Routine, RoutineExercise, ApiResponse, UserRoutine } from '../types';

type RoutineCreatePayload = {
  name: string;
  description?: string | null;
  difficulty?: number;
  duration?: number;
  daysCount?: number;
  days?: any;
  exercises?: Partial<RoutineExercise>[];
};

type RoutineUpdatePayload = Partial<RoutineCreatePayload>;

export const routineService = {
  getRoutines: async () => {
    const response = await api.get<ApiResponse<Routine[]>>('/routines');
    return response.data;
  },

  getRoutineById: async (id: number) => {
    const response = await api.get<ApiResponse<Routine>>(`/routines/${id}`);
    return response.data;
  },

  createRoutine: async (routineData: RoutineCreatePayload) => {
    const response = await api.post<ApiResponse<Routine>>('/routines', routineData);
    return response.data;
  },

  updateRoutine: async (id: number, routineData: RoutineUpdatePayload) => {
    const response = await api.put<ApiResponse<Routine>>(`/routines/${id}`, routineData);
    return response.data;
  },

  deleteRoutine: async (id: number) => {
    const response = await api.delete<ApiResponse<void>>(`/routines/${id}`);
    return response.data;
  },

  assignRoutine: async (userId: number, routineId: number) => {
    const response = await api.post<ApiResponse<UserRoutine>>('/routines/assign', {
      userId,
      routineId,
    });
    return response.data;
  },

  getUserRoutines: async (userId: number) => {
    const response = await api.get<ApiResponse<UserRoutine[]>>(`/routines/user/${userId}`);
    return response.data;
  },

  getUserActiveRoutine: async () => {
    const response = await api.get<ApiResponse<UserRoutine | null>>('/routines/user/me/routine');
    return response.data;
  },
};

export default routineService;
