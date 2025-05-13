export const apiClient = {
  async request(url: string, options: RequestInit = {}) {
    const response = await fetch(url, {
      ...options,
      credentials: 'include'
    });
    
    if (response.status === 204) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (response.headers.get('content-length') === '0') {
      return null;
    }

    return response.json();
  },

  get(url: string) {
    return this.request(url);
  },

  post(url: string, data?: any) {
    return this.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: data ? JSON.stringify(data) : undefined
    });
  }
};
