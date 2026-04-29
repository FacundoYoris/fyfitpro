import api from './api';
import {
  ApiResponse,
  MemberRoutine,
  CalendarData,
  MemberStats,
  MemberWeightStats,
  WeightLogInput,
  WorkoutLogPayload,
} from '../types';

interface WorkoutSessionLog {
  id: number;
  sessionId: number;
  exerciseId: number;
  setNumber: number;
  weight: number | null;
  reps: number | null;
  notes: string | null;
}

interface WorkoutSessionData {
  session: {
    id: number;
    date: string;
    status: string;
    notes: string | null;
  } | null;
  logs: WorkoutSessionLog[];
}

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

  getWorkoutSessionByDate: async (date: string) => {
    const response = await api.get<ApiResponse<WorkoutSessionData>>(`/members/workout/session?date=${encodeURIComponent(date)}`);
    return response.data;
  },

  getWorkoutSessionById: async (sessionId: number) => {
    const response = await api.get<ApiResponse<WorkoutSessionData>>(`/members/workout/session/${sessionId}`);
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

  getStats: async (options?: {
    exerciseId?: number;
    startDate?: string;
    endDate?: string;
    period?: string;
    routineFilter?: string;
    muscleGroup?: string;
  }) => {
    const params = new URLSearchParams();

    if (options?.exerciseId) {
      params.append('exerciseId', options.exerciseId.toString());
    }

    if (options?.startDate) {
      params.append('startDate', options.startDate);
    }

    if (options?.endDate) {
      params.append('endDate', options.endDate);
    }

    if (options?.period) {
      params.append('period', options.period);
    }

    if (options?.routineFilter) {
      params.append('routineFilter', options.routineFilter);
    }

    if (options?.muscleGroup) {
      params.append('muscleGroup', options.muscleGroup);
    }

    const queryString = params.toString();
    const response = await api.get<ApiResponse<MemberStats>>(`/members/stats${queryString ? `?${queryString}` : ''}`);
    return response.data;
  },

  getWeightStats: async (options?: { period?: string; startDate?: string; endDate?: string }) => {
    const params = new URLSearchParams();

    if (options?.period) {
      params.append('period', options.period);
    }

    if (options?.startDate) {
      params.append('startDate', options.startDate);
    }

    if (options?.endDate) {
      params.append('endDate', options.endDate);
    }

    const queryString = params.toString();
    const response = await api.get<ApiResponse<MemberWeightStats>>(`/members/weight/stats${queryString ? `?${queryString}` : ''}`);
    return response.data;
  },

  createWeightLog: async (payload: WeightLogInput) => {
    const response = await api.post<ApiResponse<{ id: number; date: string; weight: number; note: string | null }>>('/members/weight/log', payload);
    return response.data;
  },

  deleteWeightLog: async (logId: number) => {
    const response = await api.delete<ApiResponse<{ id: number }>>(`/members/weight/log/${logId}`);
    return response.data;
  },
};

export default memberService;
