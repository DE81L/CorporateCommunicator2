async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'API request failed');
  }
  return response.json();
}
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
export const getSystemInfo = async () => {
  const response = await fetch(`${API_BASE_URL}/system/info`);
  return handleResponse(response);
};

export const getAppVersion = async () => {
  const response = await fetch(`${API_BASE_URL}/app/version`);
  return handleResponse(response);
};
// Add other API functions as needed
