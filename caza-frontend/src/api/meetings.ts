import axiosInstance from './axiosConfig';
import type { ApiResponse, Meeting } from '../types';

export const meetingsApi = {
  getMeetings: async (): Promise<Meeting[]> => {
    const res = await axiosInstance.get<ApiResponse<Meeting[]>>('/meetings');
    return res.data.data;
  },

  createMeeting: async (data: {
    url: string;
    fechaInicio: string;
    fechaFin: string;
    tema: string;
  }): Promise<Meeting> => {
    const res = await axiosInstance.post<ApiResponse<Meeting>>('/meetings', data);
    return res.data.data;
  },

  deleteMeeting: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/meetings/${id}`);
  },
};
