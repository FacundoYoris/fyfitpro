import api from './api';
import { ApiResponse, MemberRoutine, CalendarData, WorkoutLogPayload } from '../types';

export const memberService = {
  getActiveRoutine: async () => {
    const response = await api.get<ApiResponse<MemberRoutine | null>>('/members/routine');
    return response.data;
  },

  getCalendar: async (month?: number, year?: number) => {
    const params = new URLSearchParams();
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());
    
    const response = await api.get<ApiResponse<CalendarData>>(`/members/calendar?${params}`);
    return response.data;
  },

  saveWorkoutLogs: async (data: WorkoutLogPayload) => {
    const response = await api.post<ApiResponse<any>>('/members/workout/logs', data);
    return response.data;
  },

  getExerciseHistory: async (exerciseId?: number) => {
    const params = exerciseId ? `?exerciseId=${exerciseId}` : '';
    const response = await api.get<ApiResponse<any>>(`/members/exercise/history${params}`);
    return response.data;
  },

  getLastWeights: async () => {
    const response = await api.get<ApiResponse<Record<number, { weight: number; date: string; reps: number }>>>('/members/exercise/last-weights');
    return response.data;
  },
};

export default memberService;