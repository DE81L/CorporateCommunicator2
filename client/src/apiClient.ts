const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'API request failed');
  }
  return response.json();
}

export const getSystemInfo = async () => {
  const response = await fetch(`${API_BASE}/api/system/info`);
  return handleResponse(response);
};

export const getAppVersion = async () => {
  const response = await fetch(`${API_BASE}/api/app/version`);
  return handleResponse(response);
};

// Add other API functions as needed