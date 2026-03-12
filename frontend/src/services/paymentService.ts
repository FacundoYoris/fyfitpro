import api from './api';
import { Payment, ApiResponse } from '../types';

interface PaymentStatus {
  isPaid: boolean;
  payment: Payment | null;
  plan: any;
  currentMonth: number;
  currentYear: number;
}

export const paymentService = {
  getPayments: async (userId?: number, month?: number, year?: number) => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId.toString());
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());
    
    const response = await api.get<ApiResponse<Payment[]>>(`/payments?${params}`);
    return response.data;
  },

  getPaymentById: async (id: number) => {
    const response = await api.get<ApiResponse<Payment>>(`/payments/${id}`);
    return response.data;
  },

  createPayment: async (paymentData: Partial<Payment>) => {
    const response = await api.post<ApiResponse<Payment>>('/payments', paymentData);
    return response.data;
  },

  getUserPaymentStatus: async (userId: number) => {
    const response = await api.get<ApiResponse<PaymentStatus>>(`/payments/user/${userId}/status`);
    return response.data;
  },

  markMonthAsPaid: async (userId: number, month: number, year: number, amount: number, paymentMethod = 'cash') => {
    const response = await api.post<ApiResponse<Payment>>('/payments/mark-paid', {
      userId,
      month,
      year,
      amount,
      paymentMethod,
    });
    return response.data;
  },

  markMonthAsUnpaid: async (userId: number, month: number, year: number) => {
    const response = await api.post<ApiResponse<Payment>>('/payments/mark-unpaid', {
      userId,
      month,
      year,
    });
    return response.data;
  },

  getUserPayments: async (userId: number) => {
    const response = await api.get<ApiResponse<Payment[]>>(`/payments/user/${userId}`);
    return response.data;
  },
};

export default paymentService;
