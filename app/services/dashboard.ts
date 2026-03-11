import axios from 'axios';
import { DashboardData, UserProfile, Notification } from '../types/dashboard';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const authHeader = (token: string) => ({ Authorization: `Token ${token}` });

const client = axios.create({ baseURL: API_BASE_URL, timeout: 10000 });

export const dashboardAPI = {
  getDashboardData: async (token: string): Promise<DashboardData> => {
    const res = await client.get<DashboardData>('/api/v1/dashboard/', {
      headers: authHeader(token),
    });
    return res.data;
  },

  getUserProfile: async (token: string): Promise<UserProfile> => {
    const res = await client.get<UserProfile>('/api/v1/profile/', {
      headers: authHeader(token),
    });
    return res.data;
  },

  getNotifications: async (token: string): Promise<Notification[]> => {
    const res = await client.get<{ results: Notification[] } | Notification[]>(
      '/api/v1/notifications/?limit=50',
      { headers: authHeader(token) }
    );
    const raw = Array.isArray(res.data) ? res.data : (res.data.results ?? []);
    return raw.map(n => ({ ...n, type: n.type || 'system', severity: n.severity || 'info' }));
  },

  markNotificationRead: async (token: string, id: number): Promise<void> => {
    await client.patch(`/api/v1/notifications/${id}/`, { is_read: true }, {
      headers: authHeader(token),
    });
  },

  markAllNotificationsRead: async (token: string): Promise<void> => {
    await client.post('/api/v1/notifications/mark-all-read/', {}, {
      headers: authHeader(token),
    });
  },

  deleteNotification: async (token: string, id: number): Promise<void> => {
    await client.delete(`/api/v1/notifications/${id}/`, {
      headers: authHeader(token),
    });
  },
};
