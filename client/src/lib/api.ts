// client/src/lib/api.ts
export const apiClient = {
  async request(url: string, options: RequestInit = {}) {
    const response = await fetch(url, {
      ...options,
      credentials: "include",
    });

    if (response.status === 204) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Иногда сервер отдает пустой ответ
    if (response.headers.get("content-length") === "0") {
      return null;
    }

    return response.json();
  },

  get(url: string) {
    return this.request(url);
  },

  post(url: string, data?: any) {
    return this.request(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: data ? JSON.stringify(data) : undefined,
    });
  },
};

export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  // Убираем любые хвостовые слеши
  const BASE = import.meta.env.VITE_API_URL.replace(/\/+$/, "");
  const url = `${BASE}/${path}`;
  console.log("[CLIENT → PROXY]", options.method ?? "GET", url, options);
  const res = await fetch(url, options);
  let payload: any;
  try {
    payload = await res.clone().json();
  } catch {
    payload = await res.text();
  }
  console.log("[PROXY → CLIENT]", res.status, payload);
  return res;
}
