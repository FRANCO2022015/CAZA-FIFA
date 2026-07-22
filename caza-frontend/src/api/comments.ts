import axiosInstance from './axiosConfig';
import type { ApiResponse, PagedResponse, Comment } from '../types';

export const commentsApi = {
  getComments: async (playerId: number, page = 0, size = 10): Promise<PagedResponse<Comment>> => {
    const res = await axiosInstance.get<ApiResponse<PagedResponse<Comment>>>(
      `/players/${playerId}/comments`,
      { params: { page, size } }
    );
    return res.data.data;
  },

  addComment: async (
    playerId: number,
    data: { contenido: string; rating: number }
  ): Promise<Comment> => {
    const res = await axiosInstance.post<ApiResponse<Comment>>(
      `/players/${playerId}/comments`,
      data
    );
    return res.data.data;
  },

  deleteComment: async (commentId: number): Promise<void> => {
    await axiosInstance.delete(`/comments/${commentId}`);
  },
};
