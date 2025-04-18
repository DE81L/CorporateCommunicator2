async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'API request failed');
  }
  return response.json();
}

export const getSystemInfo = async () => {
  const response = await fetch("/api/system/info");
  return handleResponse(response);
};

export const getAppVersion = async () => {
  const response = await fetch("/api/app/version");
  return handleResponse(response);
};
// Add other API functions as needed