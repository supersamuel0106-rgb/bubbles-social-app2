import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ConnectionError extends Error {
  constructor(message: string = "無法連線至伺服器，請確認後端服務是否已啟動。") {
    super(message);
    this.name = 'ConnectionError';
  }
}

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  // 取得當前的 JWT session token
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('User is not authenticated');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { detail: '未知的後端錯誤' };
      }
      throw new ApiError(response.status, errorData.detail || '請求失敗');
    }

    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new ConnectionError(); // 攔截網路層的連線失敗，回傳友善錯誤
    }
    throw error;
  }
}

export const api = {
  createProfile: (profileData: { id: string, username: string, avatar_url: string | null }) => 
    fetchWithAuth('/profiles/', {
      method: 'POST',
      body: JSON.stringify(profileData),
    }),
    
  getAllProfiles: () => 
    fetchWithAuth('/profiles/'),
    
  getProfile: (userId: string) => 
    fetchWithAuth(`/profiles/${userId}`),
    
  updateMessage: (userId: string, message: string) => 
    fetchWithAuth(`/profiles/${userId}/message`, {
      method: 'PATCH',
      body: JSON.stringify({ message }),
    })
};
