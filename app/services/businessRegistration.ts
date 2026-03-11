import axios, { AxiosResponse } from 'axios';
import { BusinessRegistrationRequest, BusinessRegistrationResponse } from '../types/business-registration';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for consistent error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error for debugging
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const businessRegistrationAPI = {
  /**
   * Register a new business
   */
  register: async (
    data: BusinessRegistrationRequest
  ): Promise<BusinessRegistrationResponse> => {
    try {
      const response: AxiosResponse<BusinessRegistrationResponse> = await apiClient.post(
        '/api/register/business/',
        data
      );
      return response.data;
    } catch (error: any) {
      // Re-throw with more context
      throw {
        ...error,
        isApiError: true,
      };
    }
  },

  /**
   * Check if username is available
   */
  checkUsername: async (username: string): Promise<{ available: boolean }> => {
    try {
      const response = await apiClient.get(`/api/check-username/?username=${username}`);
      return response.data;
    } catch (error: any) {
      throw {
        ...error,
        isApiError: true,
      };
    }
  },

  /**
   * Check if email is available
   */
  checkEmail: async (email: string): Promise<{ available: boolean }> => {
    try {
      const response = await apiClient.get(`/api/check-email/?email=${email}`);
      return response.data;
    } catch (error: any) {
      throw {
        ...error,
        isApiError: true,
      };
    }
  },
};

export default businessRegistrationAPI;