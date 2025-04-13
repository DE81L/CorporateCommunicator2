/* client/src/setupMocks.ts */
type Json = Record<string, unknown> | unknown[];

function json(data: Json, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

(globalThis as any).fetch = async (input: RequestInfo | URL) => {
  const url = typeof input === "string" ? input : input.toString();

  // живые данные из Electron‑хранилища
  const { messages, requests } = await window.chatAPI.getData();

  if (url.startsWith("/api/messages")) return json(messages);
  if (url.startsWith("/api/requests")) return json(requests);

  // всё остальное – пусто, чтобы UI не падал
  return json([]);
};