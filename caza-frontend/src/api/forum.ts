import axiosInstance from './axiosConfig';
import type { ApiResponse, PagedResponse, ForumThread, ForumPost } from '../types';

export const forumApi = {
  getThreads: async (page = 0, size = 10): Promise<PagedResponse<ForumThread>> => {
    const res = await axiosInstance.get<ApiResponse<PagedResponse<ForumThread>>>('/forum/threads', {
      params: { page, size },
    });
    return res.data.data;
  },

  getThread: async (id: number): Promise<ForumThread> => {
    const res = await axiosInstance.get<ApiResponse<ForumThread>>(`/forum/threads/${id}`);
    return res.data.data;
  },

  createThread: async (data: { titulo: string; descripcion: string }): Promise<ForumThread> => {
    const res = await axiosInstance.post<ApiResponse<ForumThread>>('/forum/threads', data);
    return res.data.data;
  },

  deleteThread: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/forum/threads/${id}`);
  },

  getPostsByThread: async (threadId: number): Promise<ForumPost[]> => {
    const res = await axiosInstance.get<ApiResponse<ForumPost[]>>(`/forum/threads/${threadId}/posts`);
    return res.data.data;
  },

  addPost: async (threadId: number, data: { contenido: string }): Promise<ForumPost> => {
    const res = await axiosInstance.post<ApiResponse<ForumPost>>(`/forum/threads/${threadId}/posts`, data);
    return res.data.data;
  },

  updatePost: async (postId: number, data: { contenido: string }): Promise<ForumPost> => {
    const res = await axiosInstance.put<ApiResponse<ForumPost>>(`/forum/posts/${postId}`, data);
    return res.data.data;
  },

  deletePost: async (postId: number): Promise<void> => {
    await axiosInstance.delete(`/forum/posts/${postId}`);
  },
};
