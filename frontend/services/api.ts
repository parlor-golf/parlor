import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Update this with your backend URL
// For local development: http://localhost:5000
// For production: your deployed backend URL
const API_BASE_URL = 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to all requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('idToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Types
export interface GolfSession {
  id?: string;
  uid?: string;
  username?: string;
  courseName: string;
  holes: number;
  selectedHoles?: number[];
  scores: { [holeNumber: number]: number };
  totalScore: number;
  duration: number;
  startTime: string;
  endTime: string;
  privacy: 'public' | 'friends' | 'private';
  images?: string[];
  videos?: string[];
  timestamp?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Auth functions
export const signUp = async (email: string, password: string, name: string) => {
  try {
    const response = await api.post('/sign_up', { email, password, name });
    return { data: response.data };
  } catch (error: any) {
    return { error: error.response?.data?.error || 'Sign up failed' };
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const response = await api.post('/sign_in', { email, password });
    if (response.data.idToken) {
      await AsyncStorage.setItem('idToken', response.data.idToken);
      await AsyncStorage.setItem('uid', response.data.uid);
      await AsyncStorage.setItem('name', response.data.name);
    }
    return { data: response.data };
  } catch (error: any) {
    return { error: error.response?.data?.error || 'Sign in failed' };
  }
};

export const signOut = async () => {
  await AsyncStorage.removeItem('idToken');
  await AsyncStorage.removeItem('uid');
  await AsyncStorage.removeItem('name');
};

// Session functions
export const createSession = async (sessionData: GolfSession): Promise<ApiResponse<{ sessionId: string }>> => {
  try {
    const response = await api.post('/sessions', sessionData);
    return { data: response.data };
  } catch (error: any) {
    return { error: error.response?.data?.error || 'Failed to create session' };
  }
};

export const getUserSessions = async (limit?: number): Promise<ApiResponse<{ sessions: GolfSession[] }>> => {
  try {
    const params = limit ? { limit } : {};
    const response = await api.get('/sessions', { params });
    return { data: response.data };
  } catch (error: any) {
    return { error: error.response?.data?.error || 'Failed to fetch sessions' };
  }
};

export const deleteSession = async (sessionId: string): Promise<ApiResponse<{ message: string }>> => {
  try {
    const response = await api.delete(`/sessions/${sessionId}`);
    return { data: response.data };
  } catch (error: any) {
    return { error: error.response?.data?.error || 'Failed to delete session' };
  }
};

export const getFeedSessions = async (limit: number = 20): Promise<ApiResponse<{ sessions: GolfSession[] }>> => {
  try {
    const response = await api.get('/feed', { params: { limit } });
    return { data: response.data };
  } catch (error: any) {
    return { error: error.response?.data?.error || 'Failed to fetch feed' };
  }
};

// Friend functions
export const sendFriendRequest = async (receiver_uid: string): Promise<ApiResponse<{ message: string }>> => {
  try {
    const response = await api.post('/send_friend_request', { receiver_uid });
    return { data: response.data };
  } catch (error: any) {
    return { error: error.response?.data?.error || 'Failed to send friend request' };
  }
};

export const acceptFriendRequest = async (sender_uid: string): Promise<ApiResponse<{ message: string }>> => {
  try {
    const response = await api.post('/accept_friend_request', { sender_uid });
    return { data: response.data };
  } catch (error: any) {
    return { error: error.response?.data?.error || 'Failed to accept friend request' };
  }
};

export const declineFriendRequest = async (sender_uid: string): Promise<ApiResponse<{ message: string }>> => {
  try {
    const response = await api.post('/decline_friend_request', { sender_uid });
    return { data: response.data };
  } catch (error: any) {
    return { error: error.response?.data?.error || 'Failed to decline friend request' };
  }
};

export const removeFriend = async (friend_uid: string): Promise<ApiResponse<{ message: string }>> => {
  try {
    const response = await api.post('/remove_friend', { friend_uid });
    return { data: response.data };
  } catch (error: any) {
    return { error: error.response?.data?.error || 'Failed to remove friend' };
  }
};

export const getFriendRequests = async (): Promise<ApiResponse<{ requests: string[] }>> => {
  try {
    const response = await api.get('/friend_requests');
    return { data: response.data };
  } catch (error: any) {
    return { error: error.response?.data?.error || 'Failed to fetch friend requests' };
  }
};

export const getFriends = async (): Promise<ApiResponse<{ friends: string[] }>> => {
  try {
    const response = await api.get('/friends');
    return { data: response.data };
  } catch (error: any) {
    return { error: error.response?.data?.error || 'Failed to fetch friends' };
  }
};

export const getFriendsScores = async (): Promise<ApiResponse<any[]>> => {
  try {
    const response = await api.get('/friends/scores');
    return { data: response.data };
  } catch (error: any) {
    return { error: error.response?.data?.error || 'Failed to fetch friends scores' };
  }
};

export default api;
