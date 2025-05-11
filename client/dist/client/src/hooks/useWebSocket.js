export function useWebSocket() {
    return {
        connected: false,
        sendMessage: (_msg, _to) => { },
        lastMessage: null,
    };
}
