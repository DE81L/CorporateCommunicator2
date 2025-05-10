export function useWebSocket() {
  return {
    connected: false,
    sendMessage: (_msg: string, _to?: string | number) => {},
    lastMessage: null as any,
  };
}
