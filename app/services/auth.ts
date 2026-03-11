import axios from 'axios';
import { LoginRequest, LoginResponse, UserInfo } from '../types/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8005';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authAPI = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/api/login/', data);
    return response.data;
  },

  getUserInfo: async (token: string): Promise<UserInfo> => {
    const response = await apiClient.get<UserInfo>('/api/v1/user-info/', {
      headers: { Authorization: `Token ${token}` },
    });
    return response.data;
  },
};
