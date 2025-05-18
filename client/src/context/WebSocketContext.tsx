import { createContext, useContext, ReactNode } from 'react';
import { useWebSocket, ConnectionStatus, WSMessage } from '@/hooks/useWebSocket';

interface WSContextValue {
  connectionStatus: ConnectionStatus;
  lastRawMessage: WSMessage | null;
  sendRaw: (msg: WSMessage) => void;
}

const WSContext = createContext<WSContextValue | undefined>(undefined);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const ws = useWebSocket();
  return <WSContext.Provider value={ws}>{children}</WSContext.Provider>;
}

export function useWS(): WSContextValue {
  const ctx = useContext(WSContext);
  if (!ctx) throw new Error('useWS must be used within WebSocketProvider');
  return ctx;
}
